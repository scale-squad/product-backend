const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, './404s.json')

// Initialize an empty log array to hold 404s and response times
let log404s = [];

// Function to log productId and response information
function logProductId(context, events, done) {
  // Generate a new productId for each request
  const productId = Math.floor(Math.random() * 1000011) + 1; // Generates productId between 1 and 1000011
  context.vars.productId = productId; // Store in context for use in the request URL

  // Listen for the response event to log status code and response time
  events.on('response', (request, response) => {
    const statusCode = response.statusCode;
    const responseTime = response.timings ? response.timings.duration : 0; // Get response time or default to 0

    // Log 404 responses
    if (statusCode === 404) {
      log404s.push({
        productId: productId.toString(), // Convert to string for consistency
        responseTime: responseTime,
      });
    }
  });

  return done(); // Call done to proceed with the scenario
}

// Function to write logs to file after all requests are completed
function writeLogsToFile(context, events, done) {
  // Write all 404 logs to JSON file
  fs.writeFileSync(filePath, JSON.stringify(log404s, null, 2), 'utf-8');
  console.log(`404 logs saved to ${path}`);
  return done();
}

module.exports = {
  logProductId,
  writeLogsToFile,
};
