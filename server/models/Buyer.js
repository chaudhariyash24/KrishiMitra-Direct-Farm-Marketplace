const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const buyerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessName: { type: String },
  businessType: { type: String }, // Retailer, Wholesaler, Restaurant, Exporter, Processor
  state: { type: String },
  district: { type: String },
  loc: { type: String },
  gstNumber: { type: String },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now },
});

buyerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

buyerSchema.methods.matchPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('Buyer', buyerSchema);
