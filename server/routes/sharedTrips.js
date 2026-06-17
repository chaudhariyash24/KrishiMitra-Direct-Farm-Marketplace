const express = require('express');
const router = express.Router();
const SharedTrip = require('../models/SharedTrip');

// ============================================================
// GET /api/shared-trips — List open/available shared trips
// Query: ?status=open&farmerId=xxx (to get my trips)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { status, farmerId } = req.query;
    let filter = {};

    if (farmerId) {
      // Get trips where farmer is creator OR a participant
      filter.$or = [
        { creatorId: farmerId },
        { 'participants.farmerId': farmerId },
      ];
    } else if (status) {
      filter.status = status;
    } else {
      // Default: show open and full trips (available for viewing)
      filter.status = { $in: ['open', 'full'] };
    }

    const trips = await SharedTrip.find(filter).sort({ departureDate: 1 });
    res.json(trips);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// GET /api/shared-trips/:id — Get single trip details
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const trip = await SharedTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// POST /api/shared-trips — Create a new shared trip
// ============================================================
router.post('/', async (req, res) => {
  try {
    const tripId = 'KMS-' + Date.now().toString(36).toUpperCase();
    const trip = await SharedTrip.create({ ...req.body, tripId });
    res.json(trip);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// PUT /api/shared-trips/:id/join — Request to join a trip
// Body: { farmerId, farmerName, farmerPhone, farmerLoc, weightKg, orderId?, productName? }
// ============================================================
router.put('/:id/join', async (req, res) => {
  try {
    const trip = await SharedTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'open') {
      return res.status(400).json({ message: 'Trip is no longer accepting riders' });
    }

    // Check if farmer already requested
    const existing = trip.participants.find(p => p.farmerId === req.body.farmerId);
    if (existing) {
      return res.status(400).json({ message: 'You have already requested to join this trip' });
    }

    // Check capacity
    const remainingKg = trip.totalCapacityKg - trip.usedCapacityKg;
    if (req.body.weightKg > remainingKg) {
      return res.status(400).json({ message: `Not enough capacity. Only ${remainingKg} kg remaining.` });
    }

    // Check not joining own trip
    if (trip.creatorId === req.body.farmerId) {
      return res.status(400).json({ message: 'You cannot join your own trip' });
    }

    trip.participants.push({
      farmerId: req.body.farmerId,
      farmerName: req.body.farmerName,
      farmerPhone: req.body.farmerPhone || '',
      farmerLoc: req.body.farmerLoc || '',
      weightKg: req.body.weightKg,
      orderId: req.body.orderId || '',
      productName: req.body.productName || '',
      status: 'pending',
    });

    await trip.save();
    res.json(trip);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// PUT /api/shared-trips/:id/respond — Accept/reject a join request
// Body: { farmerId, action: 'accept' | 'reject' }
// ============================================================
router.put('/:id/respond', async (req, res) => {
  try {
    const { farmerId, action } = req.body;
    const trip = await SharedTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const participant = trip.participants.find(p => p.farmerId === farmerId);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });

    if (action === 'accept') {
      participant.status = 'accepted';
    } else if (action === 'reject') {
      participant.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use accept or reject.' });
    }

    await trip.save();
    res.json(trip);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// PUT /api/shared-trips/:id/status — Update trip status
// Body: { status: 'in-transit' | 'completed' | 'cancelled' }
// ============================================================
router.put('/:id/status', async (req, res) => {
  try {
    const trip = await SharedTrip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.status = req.body.status;
    await trip.save();
    res.json(trip);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ============================================================
// DELETE /api/shared-trips/:id — Cancel/delete a trip (creator only)
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const trip = await SharedTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip cancelled', tripId: trip.tripId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
