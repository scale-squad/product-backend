const mongoose = require('mongoose');
const { Schema } = mongoose;

const uri = `mongodb://localhost:27017/ProductsAPI`;

mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

const FeatureSchema = new Schema({
    feature: { type: String, maxlength: 255, required: true },
    value: { type: String, maxlength: 255, required: true }
}, { _id: false });

const ProductSchema = new Schema({
    _id: false,
    product_id: { type: Number, unique: true, required: true },
    campus: { type: String, match: /^[A-Za-z0-9]{1,6}$/, required: true },
    name: { type: String, maxlength: 255, required: true },
    slogan: { type: String, maxlength: 255 },
    description: { type: String, required: true },
    category: { type: String, maxlength: 255, required: true },
    default_price: { type: Number, required: true },  // Changed to Number for better handling
    features: { type: [FeatureSchema], default: [] }  // Array of FeatureSchema objects
});

const StyleSchema = new Schema({
    product_id: { type: Number, required: true },
    style_id: { type: Number, required: true },
    name: { type: String, required: true },
    original_price: { type: String, required: true },
    sale_price: { type: String, default: null },
    default: { type: Boolean, default: false },
    photos: { type: Array, default: [] },
    skus: { type: Map, of: Object }
});

const RelatedSchema = new Schema({
    product_id: { type: Number, ref: 'Product', required: true },
    related_ids: { type: [Number], required: true },
});

const Product = mongoose.model('Product', ProductSchema);
const Feature = mongoose.model('Feature', FeatureSchema);
const Style = mongoose.model('Style', StyleSchema);
const Related = mongoose.model('Related', RelatedSchema);

module.exports = { Product, Feature, Style, Related };
