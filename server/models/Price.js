const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  crop: { type: String, required: true, unique: true },
  msp: { type: Number, required: true },
  mandi: { type: Number, required: true },
  change: { type: String, default: '0%' },
  trend: { type: String, default: '📊' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Price', priceSchema);
