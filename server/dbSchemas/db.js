require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const uri = process.env.DB_URI;

const db = async () => {
    try {
        await mongoose.connect(DB_URI, {
            poolSize: 15
        });
        console.log('MongoDB successfully connected.')
    } catch (error) {
        console.error('MongoDB connection failed!', error)
        process.exit(1);
    }
}
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

ProductSchema.index({product_id: 1});

const photoSchema = new mongoose.Schema({
    url: {
      type: String,
      required: true,
    },
    thumbnail_url: {
      type: String,
      required: true,
    },
  }, { _id: false }); // Prevent Mongoose from creating _id for subdocuments

  const skuSchema = new mongoose.Schema({
    sku_id: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
  }, { _id: false });

  const smallStyleSchema = new mongoose.Schema({
    style_id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    original_price: {
      type: Number,
      required: true,
    },
    sale_price: {
      type: Number,
      default: null,
    },
    default: {
      type: Boolean,
      required: true,
    },
    photos: {
      type: [photoSchema],
      default: [],
    },
    skus: {
      type: Map,
      of: skuSchema,
      default: {},
    },
  }, { _id: false });

  const StyleSchema = new mongoose.Schema({
    product_id: { type: Number, required: true },
    results: { type: [smallStyleSchema], default: [] }
  })

StyleSchema.index({product_id: 1});

const RelatedSchema = new Schema({
    product_id: { type: Number, ref: 'Product', required: true },
    related_ids: { type: [Number], required: true },
});

RelatedSchema.index({product_id: 1});

const Product = mongoose.model('Product', ProductSchema);
const Feature = mongoose.model('Feature', FeatureSchema);
const Style = mongoose.model('Style', StyleSchema);
const Related = mongoose.model('Related', RelatedSchema);

module.exports = { Product, Feature, Style, Related, db };
