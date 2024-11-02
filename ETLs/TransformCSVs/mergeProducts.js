const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const features = {};
const outputStream = fs.createWriteStream('merged_products.json');
outputStream.write(''); // Begin the JSON array

let firstEntry = true;

// Stream process the features CSV first
const processFeatures = () => {
  return new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, './newFeatures.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const productId = parseInt(row.product_id);
        if (!features[productId]) features[productId] = [];

        features[productId].push({
          feature: row.feature,
          value: row.value
        });
      })
      .on('end', resolve);
  });
};

// Stream process the products CSV and write output JSON in batches
const processProducts = async () => {
  await processFeatures();

  fs.createReadStream(path.join(__dirname, './newProduct.csv'))
    .pipe(csv())
    .on('data', (row) => {
      const productId = parseInt(row.product_id);

      // Build product entry
      const product = {
        product_id: productId,
        name: row.name,
        slogan: row.slogan,
        description: row.description,
        category: row.category,
        default_price: parseInt(row.default_price),
        features: features[productId] || []  // Add features if they exist
      };

      // Write to JSON file in streaming fashion
      if (!firstEntry) {
        outputStream.write('\n');
      } else {
        firstEntry = false;
      }
      outputStream.write(JSON.stringify(product));
    })
    .on('end', () => {
      outputStream.write(''); // End the JSON array
      outputStream.end();
      console.log('Data has been written to merged_products.json');
    });
};

processProducts().catch((err) => console.error(err));
