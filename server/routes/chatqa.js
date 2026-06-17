const express = require('express');
const router = express.Router();
const ChatQA = require('../models/ChatQA');

router.get('/', async (req, res) => {
  try {
    const qas = await ChatQA.find().sort({ createdAt: -1 });
    res.json(qas);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const q = await ChatQA.create(req.body);
    res.json(q);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const q = await ChatQA.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(q);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ChatQA.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
