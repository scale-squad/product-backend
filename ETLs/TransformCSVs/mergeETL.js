const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Paths to the input CSV files
const stylesCsvPath = path.join(__dirname, '../../newStyles.csv');
const photosCsvPath = path.join(__dirname, '../../newPhotos.csv');
const skusCsvPath = path.join(__dirname, '../../newSkus.csv');
const outputJsonPath = path.join(__dirname, './merged_styles.json');

// Step 2: Helper function to format a style record
function formatStyleRecord(style) {
  return {
    style_id: style.style_id || '',
    product_id: style.product_id || '',
    name: style.name || '',
    original_price: style.original_price !== "null" ? style.original_price : null,
    sale_price: style.sale_price !== "null" ? style.sale_price : null,
    default: style.default || false,
    photos: style.photos || [],
    skus: style.skus || {}
  };
}

// Step 3: Process styles, photos, and skus with streaming
async function processLargeCSV() {
  const styleRecords = new Map();

  // Read and process styles.csv
  fs.createReadStream(stylesCsvPath)
    .pipe(csv())
    .on('data', (row) => {
      styleRecords.set(row.style_id, {
        style_id: parseInt(row.style_id),
        product_id: parseInt(row.product_id),
        name: row.name,
        original_price: row.original_price !== "null" ? row.original_price : "null",
        sale_price: row.sale_price !== "null" ? row.sale_price : "null",
        default: row.default_style === "1",
        photos: [],
        skus: {}
      });
    })
    .on('end', () => {
      console.log('Finished reading styles.csv');

      // Read and process photos.csv
      fs.createReadStream(photosCsvPath)
        .pipe(csv())
        .on('data', (row) => {
          const style = styleRecords.get(row.style_id);
          if (style) {
            style.photos.push({
              thumbnail_url: row.thumbnail_url,
              url: row.url
            });
          }
        })
        .on('end', () => {
          console.log('Finished reading photos.csv');

          // Read and process skus.csv
          fs.createReadStream(skusCsvPath)
            .pipe(csv())
            .on('data', (row) => {
              const style = styleRecords.get(row.style_id);
              if (style) {
                style.skus[row.sku_id] = {
                  quantity: row.quantity,
                  size: row.size
                };
              }
            })
            .on('end', async () => {
              console.log('Finished reading skus.csv');

              // Step 4: Prepare to write the final output array in chunks
              const outputStream = fs.createWriteStream(outputJsonPath, { flags: 'w' });
              outputStream.write('[\n'); // Start JSON array

              let firstEntry = true;

              // Write each style record to the output JSON file in chunks
              for (const style of styleRecords.values()) {
                const formattedRecord = formatStyleRecord(style);

                // If not the first entry, add a comma
                if (!firstEntry) {
                  outputStream.write(',\n');
                }
                firstEntry = false; // After the first entry, this will be false

                // Write the formatted record directly
                outputStream.write(JSON.stringify(formattedRecord, null, 2));
              }

              outputStream.write('\n]'); // End JSON array
              outputStream.end(); // Close the write stream
              console.log(`Merged data has been written to ${outputJsonPath}`);
            });
        });
    });
}

processLargeCSV().catch(console.error);
