const express = require('express');
const router = express.Router();
const GIProduct = require('../models/GIProduct');

router.get('/', async (req, res) => {
  try {
    const gi = await GIProduct.find().sort({ createdAt: -1 });
    res.json(gi);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const g = await GIProduct.create(req.body);
    res.json(g);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const g = await GIProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(g);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/verify', async (req, res) => {
  try {
    const g = await GIProduct.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Not found' });
    g.status = 'Verified';
    if (!g.journey.includes('Certified')) g.journey.push('Certified');
    await g.save();
    res.json(g);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await GIProduct.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
