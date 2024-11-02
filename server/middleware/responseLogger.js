function responseLogger(req, res, next) {
  const start = Date.now();

  // Store the original send method
  const originalSend = res.send;

  // Override the send method
  res.send = function (body) {
    const duration = Date.now() - start;

    // Get product_id from request parameters, if available
    const productId = req.params.product_id || 'N/A'; // Use 'N/A' if product_id is not present
    const endpoint = req.originalUrl; // Get the full request URL

    // Log the response time, product ID, and endpoint
    console.log(`Response Time: ${duration} ms for ${endpoint} (Product ID: ${productId})`);

    // Call the original send method with the response body
    return originalSend.call(this, body);
  };

  next();
}

module.exports = responseLogger;
