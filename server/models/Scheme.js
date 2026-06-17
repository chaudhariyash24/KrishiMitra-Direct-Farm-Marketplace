const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  benefit: { type: String, required: true },
  elig: { type: String, required: true },
  desc: { type: String, required: true },
  docs: [{ type: String }],
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);
