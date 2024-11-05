const { Product } = require('../dbSchemas/db.js');

let productCache = new Map();
let requestQueue = [];
let isProcessing = false;
const BATCH_TIMEOUT = 25;
const MAX_BATCH_SIZE = 125;

async function processBatch() {
  if (requestQueue.length === 0) return;

  const batch = requestQueue.splice(0, MAX_BATCH_SIZE);
  const responses = [];

  for (const req of batch) {
    const page = req.page || 1;
    const count = req.count || 5;
    const startId = (page - 1) * count + 1;
    const endId = startId + count - 1;

    let cachedProducts = [];
    let missingProductIds = [];

    for (let id = startId; id <= endId; id++) {
      if (productCache.has(id)) {
        cachedProducts.push(productCache.get(id));
      } else {
        missingProductIds.push(id);
      }
    }

    try {
      if (missingProductIds.length > 0) {
        const products = await Product.find({ product_id: { $in: missingProductIds } }, '-_id').exec();

        products.forEach(product => {
          productCache.set(product.product_id, product);
          cachedProducts.push(product);
        });
      }

      responses.push({ req, data: cachedProducts });
    } catch (error) {
      console.error('Error fetching products in batch: ', error);
      responses.push({ req, error: true });
    }
  }

  responses.forEach(({ req, data, error }) => {
    if (error) {
      req.res.status(500).send({ error: 'An error occurred while fetching products.' });
    } else {
      req.res.status(200).send(data);
    }
  });

  isProcessing = false;
}

module.exports = {
  getProducts: (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const count = parseInt(req.query.count, 10) || 5;

    requestQueue.push({ page, count, res });

    if (!isProcessing) {
      isProcessing = true;
      setTimeout(processBatch, BATCH_TIMEOUT);
    }
  },
};
