const fs = require('fs');
const path = require('path');

function amendJsonFile(inputFilePath, outputFilePath, chunkSize = 1000) {
    const readStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(outputFilePath);

    let buffer = '';
    let count = 0;

    writeStream.write('['); // Start the JSON array

    readStream.on('data', (chunk) => {
        buffer += chunk;

        let entries = buffer.split('\n'); // Split into lines

        // Process all but the last line
        while (entries.length > 1) {
            const entry = entries.shift().trim();
            if (entry) {
                try {
                    let jsonEntry = JSON.parse(entry);

                    // Amend the jsonEntry
                    jsonEntry.photos = JSON.parse(jsonEntry.photos); // Parse string to array
                    jsonEntry.skus = JSON.parse(jsonEntry.skus); // Parse string to object

                    writeStream.write(JSON.stringify(jsonEntry, null, 2) + ',\n');
                    count++;
                } catch (err) {
                    console.error('Error parsing entry:', entry, err);
                }
            }
        }

        // Keep the last line in the buffer for the next chunk
        buffer = entries.join('\n');
    });

    readStream.on('end', () => {
        // Process the remaining entry in the buffer
        if (buffer) {
            try {
                let jsonEntry = JSON.parse(buffer);
                jsonEntry.photos = JSON.parse(jsonEntry.photos);
                jsonEntry.skus = JSON.parse(jsonEntry.skus);
                writeStream.write(JSON.stringify(jsonEntry, null, 2));
            } catch (err) {
                console.error('Error parsing last entry:', buffer, err);
            }
        }

        writeStream.write('\n]'); // End the JSON array
        writeStream.end(); // Close the write stream
        console.log(`Successfully amended JSON file and saved to ${outputFilePath}. Processed ${count} entries.`);
    });

    readStream.on('error', (err) => {
        console.error('Error reading the input file:', err);
    });

    writeStream.on('error', (err) => {
        console.error('Error writing to the output file:', err);
    });
}

// Specify your input and output JSON file paths
const inputFilePath = path.join(__dirname, './merged.json'); // Change this to your input JSON file
const outputFilePath = path.join(__dirname, 'amended_output_file.json'); // Desired output JSON file path

amendJsonFile(inputFilePath, outputFilePath);
