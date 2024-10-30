const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const path = require('path');
const { Style } = require(path.join(__dirname, '../../dbSchemas/db.js'));

async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ProductsAPI', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to the database.");
    } catch (error) {
        console.error("Error connecting to database:", error);
    }
}

async function batchUploadStyles(filePath, batchSize = 5000) {
    const styles = [];
    const failedUploads = []; // Array to track failed styles
    let count = 1;

    const uploadBatch = async (styles) => {
        try {
            const result = await Style.insertMany(styles, { ordered: false });
            console.log(`Successfully uploaded a batch of ${result.length} styles.`);
        } catch (error) {
            console.error("Error uploading batch:", error);
            // Log the styles that failed
            console.log('Failed styles:', styles);
            failedUploads.push(...styles); // Add failed styles to the failedUploads array
        }
    };

    const processRow = async (row) => {
        try {
            const style = {
                product_id: parseInt(row.product_id, 10),
                style_id: parseInt(row.style_id, 10),
                name: row.name,
                original_price: parseFloat(row.original_price),
                sale_price: row.sale_price === 'null' ? null : parseFloat(row.sale_price),
                default: row.default === 'true',
                photos: JSON.parse(row.photos),
                skus: JSON.parse(row.skus)
            };

            if (style.product_id && style.style_id && style.name) {
                styles.push(style);
            } else {
                console.warn(`Missing required fields for product_id: ${style.product_id}`);
            }

            if (styles.length === batchSize) {
                await uploadBatch(styles);
                count += 1;
                styles.length = 0; // Reset the array for the next batch
            }
        } catch (error) {
            console.error(`Error processing row for product_id: ${row.product_id}`, error);
        }
    };

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
            await processRow(row);
        })
        .on('end', async () => {
            if (styles.length > 0) {
                await uploadBatch(styles); // Upload any remaining styles
                console.log('Inserted remaining styles');
            }
            await mongoose.connection.close();
            console.log("Batch upload completed successfully.");
            console.log(`Total styles uploaded: ${count * batchSize + styles.length - failedUploads.length}`);
            console.log(`Total styles failed to upload: ${failedUploads.length}`);
        });
}

(async () => {
    await connectDB();
    await batchUploadStyles(path.join(__dirname, '../../merged_styles.csv'));
})();

