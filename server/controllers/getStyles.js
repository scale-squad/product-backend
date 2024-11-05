const { Style } = require('../dbSchemas/db.js');
const missingIds = require('../dbSchemas/missing_product_ids.js');

let styleCache = new Map();
let requestQueue = [];
let isProcessing = false;
const BATCH_TIMEOUT = 25;
const MAX_BATCH_SIZE = 1000;

async function processBatch() {
  if (requestQueue.length === 0) return;

  const batch = requestQueue.splice(0, MAX_BATCH_SIZE);
  const productIds = batch.map(req => req.product_id);

  try {
    const styles = await Style.find({ product_id: { $in: productIds } }, '-_id').exec();

    const stylesMap = new Map();
    styles.forEach(style => {
      if (!stylesMap.has(style.product_id)) {
        stylesMap.set(style.product_id, []);
      }
      stylesMap.get(style.product_id).push(style);
    });

    batch.forEach(req => {
      const product_id = req.product_id;
      const response = stylesMap.get(product_id);

      if (response) {
        req.res.status(200).send({
          product_id: product_id,
          results: response,
        });
      } else {
        console.log(product_id, 'late catch')
        req.res.status(404).send({ message: 'No styles found for this product ID.' });
      }
    });
  } catch (error) {
    console.error('Error fetching styles in batch: ', error);
    batch.forEach(req => {
      req.res.status(500).send({ error: 'An error occurred while fetching styles.' });
    });
  } finally {
    isProcessing = false;
  }
}

module.exports = {
  getStyles: (req, res) => {
    let productId = +req.params.product_id
    if (missingIds.has(productId)) {
      return res.status(404).send('No styles found for this product ID.')
    }

    if (styleCache.has(productId)) {
      return res.status(200).send({
        product_id: productId,
        results: styleCache.get(productId),
      });
    }

    requestQueue.push({ product_id: productId, res });

    if (!isProcessing) {
      isProcessing = true;
      setTimeout(processBatch, BATCH_TIMEOUT);
    }
  },
};
