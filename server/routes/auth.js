const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');
const Admin = require('../models/Admin');
const Buyer = require('../models/Buyer');

const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register/farmer
router.post('/register/farmer', async (req, res) => {
  try {
    const { name, phone, password, aadhaar, state, district, land, crop, income } = req.body;
    const exists = await Farmer.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Phone already registered' });
    const farmerId = 'KS-' + Math.floor(1000 + Math.random() * 9000);
    const loc = district + ', ' + state;
    const farmer = await Farmer.create({ id: farmerId, name, phone, password, aadhaar, state, district, loc, land, crop, income });
    res.json({ token: genToken(farmer._id, 'farmer'), farmer: { id: farmer.id, name, phone, state, district, loc, land, crop, income } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/register/admin
router.post('/register/admin', async (req, res) => {
  try {
    const { name, empId, username, password, department, phone } = req.body;
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already taken' });
    const admin = await Admin.create({ name, empId, username, password, department, phone });
    res.json({ token: genToken(admin._id, 'admin'), admin: { name, username } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login/farmer
router.post('/login/farmer', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const farmer = await Farmer.findOne({ phone });
    if (!farmer || !(await farmer.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: genToken(farmer._id, 'farmer'), farmer: { id: farmer.id, name: farmer.name, phone: farmer.phone, state: farmer.state, district: farmer.district, loc: farmer.loc, land: farmer.land, crop: farmer.crop, income: farmer.income } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login/admin
router.post('/login/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Default admin
    if (username === 'yash' && password === 'yash@123') {
      return res.json({ token: genToken('admin-yash', 'admin'), admin: { name: 'Yash', username: 'yash' } });
    }
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: genToken(admin._id, 'admin'), admin: { name: admin.name, username: admin.username } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/register/buyer
router.post('/register/buyer', async (req, res) => {
  try {
    const { name, phone, password, businessName, businessType, state, district, gstNumber } = req.body;
    const exists = await Buyer.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Phone already registered' });
    const buyerId = 'KB-' + Math.floor(1000 + Math.random() * 9000);
    const loc = district + ', ' + state;
    const buyer = await Buyer.create({ id: buyerId, name, phone, password, businessName, businessType, state, district, loc, gstNumber });
    res.json({ token: genToken(buyer._id, 'buyer'), buyer: { id: buyer.id, name, phone, businessName, businessType, state, district, loc } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login/buyer
router.post('/login/buyer', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const buyer = await Buyer.findOne({ phone });
    if (!buyer || !(await buyer.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: genToken(buyer._id, 'buyer'), buyer: { id: buyer.id, name: buyer.name, phone: buyer.phone, businessName: buyer.businessName, businessType: buyer.businessType, state: buyer.state, district: buyer.district, loc: buyer.loc } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
