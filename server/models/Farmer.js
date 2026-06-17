const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const farmerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  aadhaar: { type: String },
  password: { type: String, required: true },
  state: { type: String },
  district: { type: String },
  loc: { type: String },
  land: { type: Number, default: 2 },
  crop: { type: String },
  income: { type: Number, default: 80000 },
  photo: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

farmerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

farmerSchema.methods.matchPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('Farmer', farmerSchema);
