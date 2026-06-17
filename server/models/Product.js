const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: '🌾' },
  price: { type: Number, required: true },      // kept for backward compat (avg of range)
  minPrice: { type: Number },
  maxPrice: { type: Number },
  qty: { type: Number, required: true },
  farmer: { type: String, required: true },
  sellerId: { type: String, default: '' },
  loc: { type: String, required: true },
  cat: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
