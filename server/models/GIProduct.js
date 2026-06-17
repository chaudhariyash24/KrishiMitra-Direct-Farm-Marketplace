const mongoose = require('mongoose');

const giSchema = new mongoose.Schema({
  name: { type: String, required: true },
  origin: { type: String, required: true },
  state: { type: String, required: true },
  farmer: { type: String, required: true },
  journey: [{ type: String }],
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GIProduct', giSchema);
