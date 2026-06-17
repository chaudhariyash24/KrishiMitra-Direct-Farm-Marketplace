const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  temp: { type: Number, default: 28 },
  humid: { type: Number, default: 72 },
  wind: { type: Number, default: 12 },
  rain: { type: Number, default: 3 },
  cond: { type: String, default: '⛅ Partly Cloudy' },
  adv: { type: String, default: 'Good day for irrigation. Avoid pesticide spraying.' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Weather', weatherSchema);
