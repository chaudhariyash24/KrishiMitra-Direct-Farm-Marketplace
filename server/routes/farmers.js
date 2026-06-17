const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

// GET /api/farmers
router.get('/', async (req, res) => {
  try {
    const farmers = await Farmer.find().select('-password').sort({ createdAt: -1 });
    res.json(farmers);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/farmers/:id
router.get('/:id', async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ id: req.params.id }).select('-password');
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/farmers/:id – update profile
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, state, district, land, crop, income } = req.body;
    const farmer = await Farmer.findOne({ id: req.params.id });
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    if (name) farmer.name = name;
    if (phone) farmer.phone = phone;
    if (state) farmer.state = state;
    if (district) farmer.district = district;
    if (state || district) farmer.loc = (district || farmer.district) + ', ' + (state || farmer.state);
    if (land) farmer.land = land;
    if (crop) farmer.crop = crop;
    if (income) farmer.income = income;
    await farmer.save();
    res.json({ id: farmer.id, name: farmer.name, loc: farmer.loc, land: farmer.land, crop: farmer.crop, income: farmer.income });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
