const { Product } = require('../dbSchemas/db.js');

let productCache = new Map();
let requestQueue = []; // Queue to hold incoming requests
let isProcessing = false; // Flag to indicate if we are currently processing a batch
const BATCH_TIMEOUT = 25; // Time in ms to wait before processing a batch
const MAX_BATCH_SIZE = 1000; // Maximum number of requests to process in one batch

// Function to process the queued requests
async function processBatch() {
  if (requestQueue.length === 0) return; // Nothing to process

  // Gather requests from the queue
  const batch = requestQueue.splice(0, MAX_BATCH_SIZE); // Get up to MAX_BATCH_SIZE requests
  const productIds = batch.map(req => req.product_id); // Extract product IDs

  try {
    // Fetch all products in one query
    const products = await Product.find({ product_id: { $in: productIds } }, '-_id').exec();

    // Create a map for quick lookup
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product.product_id, product);
    });

    // Send responses for each request in the batch
    batch.forEach(req => {
      const product_id = req.product_id;
      const response = productMap.get(product_id);

      if (response) {
        req.res.status(200).send(response);
      } else {
        req.res.status(404).send({ message: 'Product not found' });
      }
    });
  } catch (error) {
    console.error('Error fetching products in batch: ', error);
    batch.forEach(req => {
      req.res.status(500).send({ error: 'An error occurred while fetching products.' });
    });
  } finally {
    isProcessing = false; // Mark processing as complete
  }
}

module.exports = {
  getProduct: (req, res) => {
    const product_id = +req.params.product_id;

    // Check if the product is already cached
    if (productCache.has(product_id)) {
      return res.status(200).send(productCache.get(product_id));
    }

    // Add request to the queue
    requestQueue.push({ product_id, res });

    // If not already processing, set a timeout to process the batch
    if (!isProcessing) {
      isProcessing = true;
      setTimeout(processBatch, BATCH_TIMEOUT);
    }
  },
};
