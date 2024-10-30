const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
const {Related} = require(path.join(__dirname, '../../dbSchemas/db.js')); // Adjust the path as needed

const inputFilePath = path.join(__dirname, '../../newRelated.csv'); // Path to your CSV file
const BATCH_SIZE = 250; // Adjust batch size according to your memory limits

// Connect to MongoDB only if not already connected
async function connectToMongoDB() {
  if (mongoose.connection.readyState === 0) { // 0 means disconnected
    await mongoose.connect('mongodb://localhost:27017/ProductsAPI', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } else {
    console.log('Already connected to MongoDB');
  }
}

async function insertCsvData() {
  await connectToMongoDB(); // Ensure connection is established

  const readStream = fs.createReadStream(inputFilePath)
    .pipe(csv({ headers: ['product_id', 'related_ids'] }));

  let batch = []; // Array to hold the batch of documents
  let meow = false;
  readStream.on('data', (row) => {
    const productId = Number(row.product_id); // Convert product_id to a number
    const relatedIds = row.related_ids.replace(/[\[\]"]/g, '').split(',').map(Number); // Parse related_ids string
    // Push the document to the batch

    if (meow === false && productId > 250000) {
      console.log('over 250000');
      meow = true;
    }
    batch.push({ product_id: productId, related_ids: relatedIds });

    // If the batch size is reached, insert the batch
    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      batch = []; // Clear the batch after insertion
    }
  });

  readStream.on('end', async () => {
    // Insert any remaining documents in the batch
    if (batch.length > 0) {
      await insertBatch(batch);
    }
    console.log('Finished reading the CSV file');
    mongoose.connection.close();
  });

  readStream.on('error', (error) => {
    console.error('Error processing the file:', error);
    mongoose.connection.close();
  });
}

// Function to insert a batch into the database
async function insertBatch(batch) {
  try {
    await Related.insertMany(batch, { ordered: false }); // Insert the batch into MongoDB
  } catch (error) {
    console.error('Error inserting batch:', error);
  }
}

// Call the function to insert data from CSV
insertCsvData().catch(console.error);
