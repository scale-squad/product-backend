const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function convertCsvToMongoJsonWithPhotosAndSkus(
  stylesCsvPath,
  photosCsvPath,
  skusCsvPath,
  outputJsonPath,
  chunkSize = 10000
) {
  const productMap = new Map(); // Map to hold product data by product_id
  const photosMap = new Map(); // Map to hold photos grouped by style_id
  const skusMap = new Map(); // Map to hold SKUs grouped by style_id

  // Helper function to read a CSV and store data in a map
  function loadCsvDataIntoMap(csvPath, keyField, map, transformFunc) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const key = row[keyField];
          if (!map.has(key)) {
            map.set(key, []);
          }
          map.get(key).push(transformFunc(row));
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  // Load photos CSV
  const loadPhotos = loadCsvDataIntoMap(
    photosCsvPath,
    'style_id',
    photosMap,
    (row) => ({
      url: row.url,
      thumbnail_url: row.thumbnail_url
    })
  );

  // Load skus CSV
  const loadSkus = loadCsvDataIntoMap(
    skusCsvPath,
    'style_id',
    skusMap,
    (row) => ({
      sku_id: row.sku_id,
      quantity: parseInt(row.quantity),
      size: row.size
    })
  );

  // Main function to parse the styles CSV and write the JSON output
  Promise.all([loadPhotos, loadSkus]).then(() => {
    const writeStream = fs.createWriteStream(outputJsonPath, { flags: 'a' });

    fs.createReadStream(stylesCsvPath)
      .pipe(csv())
      .on('data', (data) => {
        const product_id = data.product_id;

        const style = {
          style_id: parseInt(data.style_id),
          name: data.name,
          original_price: data.original_price === "null" ? null : parseFloat(data.original_price),
          sale_price: data.sale_price === "null" ? null : parseFloat(data.sale_price),
          default: data.default_style === "1",
          photos: photosMap.get(data.style_id) || [],
          skus: {}
        };

        // Populate SKUs for the style
        if (skusMap.has(data.style_id)) {
          skusMap.get(data.style_id).forEach((sku) => {
            style.skus[sku.sku_id] = { quantity: sku.quantity, size: sku.size };
          });
        }

        // If we haven't seen this product_id before, add it to the map
        if (!productMap.has(product_id)) {
          productMap.set(product_id, { product_id: parseInt(product_id), results: [] });
        }

        // Add the style to the correct product's results array
        productMap.get(product_id).results.push(style);

        // Process chunk if map reaches chunk size
        if (productMap.size >= chunkSize) {
          flushProductMap(writeStream);
        }
      })
      .on('end', () => {
        // Write any remaining data
        flushProductMap(writeStream);

        // Close the write stream
        writeStream.end();
        console.log(`Converted ${stylesCsvPath} to ${outputJsonPath}`);
      })
      .on('error', (error) => {
        console.error('Error reading the styles CSV file:', error);
      });

    // Function to write chunk to JSON file and clear map
    function flushProductMap(stream) {
      const chunk = Array.from(productMap.values());
      chunk.forEach((item) => {
        stream.write(JSON.stringify(item) + '\n'); // Write each document on its own line
      });
      productMap.clear(); // Clear map after writing
    }
  });
}

// Usage
convertCsvToMongoJsonWithPhotosAndSkus(
  path.join(__dirname, './newStyles.csv'),
  path.join(__dirname, './newPhotos.csv'),
  path.join(__dirname, './newSkus.csv'),
  path.join(__dirname, './output.json')
);
