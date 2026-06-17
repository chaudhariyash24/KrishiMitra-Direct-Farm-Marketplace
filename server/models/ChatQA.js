const mongoose = require('mongoose');

const chatQASchema = new mongoose.Schema({
  keywords: [{ type: String }],
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatQA', chatQASchema);
