const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function convertToJSON(obj) {
  // Clone the object to avoid modifying the original
  let result = { ...obj };

  // Parse `sale_price` and `default` to be actual null and boolean types
  result.style_id = Number(result.style_id);
  result.sale_price = result.sale_price === 'null' ? null : result.sale_price;
  result.default = result.default === 'true';

  // Parse `photos` and `skus` fields from strings to JSON objects
  try {
    result.photos = JSON.parse(result.photos);
    result.skus = JSON.parse(result.skus);
  } catch (error) {
    console.error("Error parsing photos or skus:", error);
  }

  // Convert the JavaScript object to a JSON string with formatted output
  return JSON.stringify(result, null, 2);
}

function convertCsvToJsonInChunks(csvFilePath, jsonFilePath, chunkSize = 1000) {
    const results = []; // Array to hold all parsed CSV rows
    let currentChunk = []; // Array to hold the current chunk of rows

    // Create a write stream for the output JSON file
    const writeStream = fs.createWriteStream(jsonFilePath, { flags: 'a' });

    // Start the JSON array
    writeStream.write('[\n');

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            currentChunk.push(convertToJSON(data)); // Add each parsed row to the current chunk

            // If the current chunk has reached the specified size
            if (currentChunk.length >= chunkSize) {
                // Write the current chunk to the JSON file
                currentChunk.forEach((chunk) => { writeStream.write(chunk + '\n')});
                currentChunk = []; // Reset the current chunk
            }
        })
        .on('end', () => {
            // Write any remaining data in the last chunk
            if (currentChunk.length > 0) {
                writeStream.write(JSON.stringify(currentChunk, null, 2));
            }

            writeStream.write('\n]'); // End the JSON array
            writeStream.end(); // Close the write stream
            console.log(`Converted ${csvFilePath} to ${jsonFilePath}`);
        })
        .on('error', (error) => {
            console.error('Error reading the CSV file:', error);
        });
}

// Specify your CSV file path and desired JSON output path
const csvFilePath = path.join(__dirname, 'merged_styles.csv'); // Change this to your CSV file
const jsonFilePath = path.join(__dirname, 'merge_fix_please.json');   // Desired output JSON file path

convertCsvToJsonInChunks(csvFilePath, jsonFilePath);
