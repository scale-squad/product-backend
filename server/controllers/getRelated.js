const { Related } = require('../dbSchemas/db.js');

let relatedCache = new Map();
relatedCache.set(10, 'No products are related to this one.');
relatedCache.set(11, 'No products are related to this one.');
let requestQueue = [];
let isProcessing = false;
const BATCH_TIMEOUT = 25;
const MAX_BATCH_SIZE = 1000;

async function processBatch() {
  if (requestQueue.length === 0) return;

  // Gather requests from the queue
  const batch = requestQueue.splice(0, MAX_BATCH_SIZE);
  const productIds = batch.map(req => req.product_id);

  try {
    const relatedItems = await Related.find({ product_id: { $in: productIds } }, '-_id').exec();

    const relatedMap = new Map();
    relatedItems.forEach(item => {
      if (!relatedMap.has(item.product_id)) {
        relatedMap.set(item.product_id, []);
      }
      relatedMap.get(item.product_id).push(item);
    });

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
    isProcessing = false;
  }
}

module.exports = {
  getRelated: (req, res) => {
    const product_id = +req.params.product_id;

    if (relatedCache.has(product_id)) {
      return res.status(200).send(relatedCache.get(product_id));
    }

    requestQueue.push({ product_id, res });

    if (!isProcessing) {
      isProcessing = true;
      setTimeout(processBatch, BATCH_TIMEOUT);
    }
  },
};
