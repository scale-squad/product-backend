const { Product } = require('../dbSchemas/db.js');

let productCache = new Map();
let requestQueue = [];
let isProcessing = false;
const BATCH_TIMEOUT = 100;
const MAX_BATCH_SIZE = 1000;

async function processBatch() {
  if (requestQueue.length === 0) return;

  const batch = requestQueue.splice(0, MAX_BATCH_SIZE);
  const productIds = batch.map(req => req.product_id);

  try {
    const products = await Product.find({ product_id: { $in: productIds } }, '-_id').exec();

    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product.product_id, product);
      productCache.set(product.product_id, product);
    });

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
    isProcessing = false;
  }
}

module.exports = {
  getProduct: (req, res) => {
    const product_id = +req.params.product_id;

    if (productCache.has(product_id)) {
      return res.status(200).send(productCache.get(product_id));
    }

    requestQueue.push({ product_id, res });

    if (!isProcessing) {
      isProcessing = true;
      setTimeout(processBatch, BATCH_TIMEOUT);
    }
  },
};
