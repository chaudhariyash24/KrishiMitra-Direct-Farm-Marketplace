const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { sellerId, buyerId, sellerName } = req.query;
    let filter = {};
    if (sellerId && sellerName) {
      filter.$or = [{ sellerId }, { sellerName }];
    } else if (sellerId) {
      filter.sellerId = sellerId;
    } else if (sellerName) {
      filter.sellerName = sellerName;
    }
    if (buyerId) filter.buyerId = buyerId;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/orders — buyer creates an offer
router.post('/', async (req, res) => {
  try {
    const orderId = 'KMO-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*1000);
    const offeredPrice = req.body.offeredPrice || req.body.price;
    const totalAmount = offeredPrice * (req.body.qty || 1);
    const order = await Order.create({
      ...req.body, orderId, offeredPrice, totalAmount,
      status: 'offer-pending',
      escrow: { status: 'pending' },
    });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id — general update
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ===== OFFER FLOW =====

// PUT /api/orders/:id/accept — farmer accepts buyer's offer
router.put('/:id/accept', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = 'accepted';
    order.acceptedAt = new Date();
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id/reject — farmer rejects buyer's offer
router.put('/:id/reject', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = 'rejected';
    order.rejectedReason = req.body.reason || '';
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ===== ESCROW FLOW =====

// PUT /api/orders/:id/escrow/pay — buyer pays to platform
router.put('/:id/escrow/pay', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.escrow.status = 'held';
    order.escrow.buyerPaid = true;
    order.escrow.buyerPaidAt = new Date();
    order.escrow.heldAt = new Date();
    order.escrow.farmerSeesPayment = true;
    order.status = 'payment-held';
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id/escrow/approve-unload — farmer approves unloading
router.put('/:id/escrow/approve-unload', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.escrow.farmerApprovedUnload = true;
    order.escrow.farmerApprovedUnloadAt = new Date();
    order.escrow.status = 'awaiting-unload';
    order.status = 'unload-pending';
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id/escrow/confirm-received — buyer confirms goods received
router.put('/:id/escrow/confirm-received', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.escrow.buyerConfirmedReceived = true;
    order.escrow.buyerConfirmedReceivedAt = new Date();
    // Both agreed → release payment
    if (order.escrow.farmerApprovedUnload) {
      order.escrow.status = 'released';
      order.escrow.releasedAt = new Date();
      order.status = 'delivered';
    }
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id/escrow/dispute
router.put('/:id/escrow/dispute', async (req, res) => {
  try {
    const { role, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.escrow.status = 'disputed';
    order.escrow.disputedBy = role;
    order.escrow.disputeReason = reason || 'No reason';
    order.escrow.disputedAt = new Date();
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/orders/:id/escrow/resolve — admin resolves
router.put('/:id/escrow/resolve', async (req, res) => {
  try {
    const { action } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.escrow.resolvedAt = new Date();
    order.escrow.resolvedAction = action;
    if (action === 'release') {
      order.escrow.status = 'released';
      order.escrow.releasedAt = new Date();
      order.status = 'delivered';
    } else {
      order.escrow.status = 'refunded';
      order.status = 'cancelled';
    }
    await order.save();
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
