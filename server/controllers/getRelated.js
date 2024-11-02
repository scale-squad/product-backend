const { Related } = require('../dbSchemas/db.js');

let relatedCache = new Map();
relatedCache.set(10, 'No products are related to this one.');
relatedCache.set(11, 'No products are related to this one.');
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
    // Fetch all related items in one query
    const relatedItems = await Related.find({ product_id: { $in: productIds } }, '-_id').exec();

    // Create a map for quick lookup
    const relatedMap = new Map();
    relatedItems.forEach(item => {
      if (!relatedMap.has(item.product_id)) {
        relatedMap.set(item.product_id, []); // Initialize an array for related items
      }
      relatedMap.get(item.product_id).push(item); // Add related item to the corresponding product ID
    });

    // Send responses for each request in the batch
    batch.forEach(req => {
      const product_id = req.product_id;
      const response = relatedMap.get(product_id);

      if (response) {
        req.res.status(200).send(response);
      } else {
        req.res.status(404).send({ message: 'No related items found for this product ID.' });
      }
    });
  } catch (error) {
    console.error('Error fetching related items in batch: ', error);
    batch.forEach(req => {
      req.res.status(500).send({ error: 'An error occurred while fetching related items.' });
    });
  } finally {
    isProcessing = false; // Mark processing as complete
  }
}

module.exports = {
  getRelated: (req, res) => {
    const product_id = +req.params.product_id;

    // Check if the related items are already cached
    if (relatedCache.has(product_id)) {
      return res.status(200).send(relatedCache.get(product_id));
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
