const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, './product_id_logs.json')
const missingIds = require('./server/dbSchemas/missing_product_ids.js');

// Initialize an empty array to store the logs
let logs = [];

// Function to log product_id and status code to a JSON file
function logProductId(context, events, done) {
  let productId = Math.floor(Math.random() * (1000010)) + 1;
  while (missingIds.has(productId)) {
    productId = Math.floor(Math.random() * (1000010)) + 1;
  } // Random product_id between 1 and 1000011
  const page = Math.floor(Math.random() * 10) + 1;
  const count = Math.floor(Math.random() * 10) + 1;
  context.vars.productId = productId;
  context.vars.page = page;
  context.vars.count = count;

  // Listen for response and log status code after each request
  events.on('response', (request, response) => {
    const logEntry = {
      product_id: context.vars.productId,
      status_code: response.statusCode,
    };

    // Push log entry to the array
    logs.push(logEntry);

    // Write logs to file with error handling
    try {
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing to file:', error);
    }
  });

  return done();
}

module.exports = {
  logProductId,
};
