const path = require('path');
const { getProducts } = require(path.join(__dirname, './controllers/getProducts.js'))
const { getProduct } = require(path.join(__dirname, './controllers/getProduct.js'));
const { getStyles } = require(path.join(__dirname, './controllers/getStyles.js'));
const { getRelated } = require(path.join(__dirname, './controllers/getRelated.js'));
const router = require('express').Router();

//connecting controller methods to their corresponding routes:
router.get('/products', getProducts);
//takes optional page and or count parameters which default to 1 and 5 respectively

router.get('/products/:product_id', getProduct);

router.get('/products/:product_id/styles', getStyles);

router.get('/products/:product_id/related', getRelated);

module.exports = router;