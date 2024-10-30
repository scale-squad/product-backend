const fs = require('fs');
const path = require('path');

function modifyJsonInChunks(inputFilePath, outputFilePath, chunkSize = 1000) {
    const results = []; // Array to hold all parsed JSON objects
    let currentChunk = []; // Array to hold the current chunk of objects

    // Create a write stream for the output JSON file
    const writeStream = fs.createWriteStream(outputFilePath, { flags: 'a' });

    // Start the JSON array
    writeStream.write('[\n');

    // Create a read stream for the input JSON file
    const readStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });

    let buffer = '';
    readStream.on('data', (chunk) => {
      console.log(chunk);
        buffer += chunk; // Append chunk to buffer

        // Split buffer by newlines to process complete JSON objects
        let lines = buffer.split('\n');
        while (lines.length > 1) {
            const line = lines.shift(); // Get the first complete line
            if (line) {
                const jsonObject = JSON.parse(line); // Parse the JSON object

                // Modify style_id to an integer
                if (jsonObject.style_id) {
                    jsonObject.style_id = parseInt(jsonObject.style_id, 10);
                }

                currentChunk.push(jsonObject); // Add to current chunk

                // If the current chunk has reached the specified size
                if (currentChunk.length >= chunkSize) {
                    // Write the current chunk to the JSON file
                    writeStream.write(JSON.stringify(currentChunk, null, 2) + ',\n');
                    currentChunk = []; // Reset the current chunk
                }
            }
        }
        buffer = lines.join('\n'); // Update buffer with any remaining lines
    });

    readStream.on('end', () => {
        // Write any remaining data in the last chunk
        if (currentChunk.length > 0) {
            writeStream.write(JSON.stringify(currentChunk, null, 2));
        }

        writeStream.write('\n]'); // End the JSON array
        writeStream.end(); // Close the write stream
        console.log(`Converted ${inputFilePath} to ${outputFilePath}`);
    });

    readStream.on('error', (error) => {
        console.error('Error reading the JSON file:', error);
    });
}

const inputFilePath = path.join(__dirname, './merged_styles.json');  // Replace with your input file path
const outputFilePath = './fixed_merged_styles.json'; // Replace with your output file path
modifyJsonInChunks(inputFilePath, outputFilePath);


