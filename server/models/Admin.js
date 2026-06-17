const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.matchPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
