const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const path = require('path');

// MongoDB connection URI and configuration
const uri = 'mongodb://localhost:27017';
const dbName = 'ProductsAPI';

async function uploadPhotosToStyles(
    collectionName = 'Styles',
    csvFilePath = path.join(__dirname, '../../newPhotos.csv')
) {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Read CSV file as stream and process each row individually
    const readStream = fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', async (row) => {
            readStream.pause(); // Pause the stream during database operation

            const filter = { style_id: row.style_id }; // Assuming product_id is the unique identifier
            const update = {
                $push: {
                    photos: {
                        url: row.url,
                        thumbnail_url: row.thumbnail_url
                    } // Push the entire row into the `related_products` array
                }
            };
            const options = { upsert: true }; // Insert document if not found

            try {
                await collection.updateOne(filter, update, options); // Push into array or insert document
                console.log(`Processed record for product_id: ${row.product_id}`);
            } catch (err) {
                console.error(`Error processing record for product_id ${row.product_id}:`, err);
                return;
            }

            readStream.resume(); // Resume the stream after operation
        })
        .on('end', async () => {
            console.log('CSV file upload complete.');
            await client.close();
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            client.close();
        });
}

// Call the upload function
uploadPhotosToStyles().catch(console.error);
