const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const inputFilePath = path.join(__dirname, '../../newRelated.csv');
const outputFilePath = path.join(__dirname, '../../outputRelated.csv');

// Function to process the CSV file and write the results to a new CSV file
async function processCsvData() {
  const readStream = fs.createReadStream(inputFilePath)
    .pipe(csv({ headers: ['product_id', 'related_id'] }));

  const productRelations = new Map(); // Map to store product_id and corresponding related_ids

  readStream.on('data', (row) => {
    // Convert product_id to a number and trim whitespace
    const productId = Number(row.product_id);
    const relatedId = row.related_id.trim(); // This is already a single related_id string

    // Check if productId is a valid number
    if (!isNaN(productId)) {
      // Add related_id to the corresponding product_id in the map
      if (!productRelations.has(productId)) {
        productRelations.set(productId, []);
      }
      const relatedIds = productRelations.get(productId);

      // Avoid duplicates in the related_ids array
      if (!relatedIds.includes(relatedId)) {
        relatedIds.push(relatedId);
      }
    } else {
      console.warn(`Invalid product_id "${row.product_id}" found; skipping...`);
    }
  });

  readStream.on('end', () => {
    console.log('Finished reading the CSV file');

    // Create a new CSV write stream
    const writeStream = fs.createWriteStream(outputFilePath);
    writeStream.write('product_id,related_ids\n'); // Write header

    // Write each product_id with its related_ids array to the new CSV file
    for (const [productId, relatedIds] of productRelations.entries()) {
      try {
        // Write product_id and related_ids to the new CSV file
        writeStream.write(`${productId},"${JSON.stringify(relatedIds)}"\n`);
      } catch (error) {
        console.error(`Error writing product_id ${productId} to CSV:`, error);
      }
    }

    writeStream.end(); // Close the write stream
    console.log(`Data has been written to ${outputFilePath}`);
  });

  readStream.on('error', (error) => {
    console.error('Error processing the file:', error);
  });
}

// Call the function to process data from CSV
processCsvData().catch(console.error);
