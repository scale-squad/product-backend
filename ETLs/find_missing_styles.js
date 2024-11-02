const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function findMissingProductIds(csvFilePath, outputJsPath) {
  return new Promise((resolve, reject) => {
    const existingProductIds = new Set();
    const maxProductId = 1000011;

    // Step 1: Create a read stream and populate existingProductIds with product IDs from the CSV
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const productId = parseInt(row.product_id, 10); // adjust if product_id column has a different name
        if (productId >= 1 && productId <= maxProductId) {
          existingProductIds.add(productId);
        }
      })
      .on('end', () => {
        // Step 2: Initialize Map with missing product IDs
        const missingProductIds = new Map();
        for (let i = 1; i <= maxProductId; i++) {
          if (!existingProductIds.has(i)) {
            missingProductIds.set(i.toString(), true); // Use strings for product IDs
          }
        }

        // Step 3: Create a JavaScript file that exports the Map
        const mapString = `module.exports = new Map(${JSON.stringify(
          Array.from(missingProductIds.entries())
        )});`;

        fs.writeFile(outputJsPath, mapString, (err) => {
          if (err) {
            console.error('Error writing JS file:', err);
            reject(err);
          } else {
            console.log(`Missing product IDs Map saved to ${outputJsPath}`);
            resolve(missingProductIds);
          }
        });
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Usage example:
const csvFilePath = path.join(__dirname, './newProduct.csv');
const outputJsPath = './missingProductIds.js';
findMissingProductIds(csvFilePath, outputJsPath)
  .then((missingProductIds) => {
    console.log(`Total missing product IDs: ${missingProductIds.size}`);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
