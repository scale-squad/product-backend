const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

function convertCsvToJsonForMongoImport(csvFilePath, jsonFilePath) {
    // Create a write stream for the output JSON file
    const writeStream = fs.createWriteStream(jsonFilePath, { flags: 'a' });

    // Reading CSV and processing data
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            const productId = parseInt(data.product_id, 10);
            const relatedIds = JSON.parse(data.related_ids).map(Number); // Parse and convert to numbers

            // Create the document for mongoimport
            const document = {
                product_id: productId,
                related_ids: relatedIds
            };

            // Write the document to the JSON file
            writeStream.write(JSON.stringify(document) + '\n');
        })
        .on('end', () => {
            writeStream.end(); // Close the write stream
            console.log(`Converted ${csvFilePath} to ${jsonFilePath} for mongoimport.`);
        })
        .on('error', (error) => {
            console.error('Error reading the CSV file:', error);
        });
}


// Usage
convertCsvToJsonForMongoImport(path.join(__dirname, './newRelated.csv'), path.join(__dirname, './fixedRelated.json'));
