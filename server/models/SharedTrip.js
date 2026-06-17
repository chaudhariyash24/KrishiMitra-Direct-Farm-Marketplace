const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  farmerId: { type: String, required: true },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String },
  farmerLoc: { type: String },
  weightKg: { type: Number, required: true },
  orderId: { type: String },       // optional — linked marketplace order
  productName: { type: String },   // what they're shipping
  fareShare: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  joinedAt: { type: Date, default: Date.now },
});

const sharedTripSchema = new mongoose.Schema({
  tripId: { type: String, unique: true },

  // Creator (the farmer who initiated the trip)
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  creatorPhone: { type: String },
  creatorWeightKg: { type: Number, required: true },
  creatorOrderId: { type: String },
  creatorProductName: { type: String },

  // Route
  pickup: { type: String, required: true },
  drop: { type: String, required: true },
  distance: { type: Number, required: true },     // in km
  duration: { type: String },

  // Vehicle
  vehicleId: { type: String, required: true },
  vehicleName: { type: String, required: true },
  vehicleIcon: { type: String },
  vehicleCapacityKg: { type: Number, required: true },  // total capacity in kg
  vehicleRate: { type: Number, required: true },          // ₹/km
  vehicleCold: { type: Boolean, default: false },

  // Capacity tracking
  totalCapacityKg: { type: Number, required: true },
  usedCapacityKg: { type: Number, required: true },      // creator weight + accepted participants

  // Schedule
  departureDate: { type: Date, required: true },
  departureNote: { type: String },   // e.g., "Early morning pickup from Nashik mandi"

  // Fare
  baseFare: { type: Number, required: true },
  totalFare: { type: Number, required: true },

  // Sharing mode
  sharingMode: { type: String, enum: ['public', 'private'], default: 'public' },

  // Status
  status: { type: String, enum: ['open', 'full', 'in-transit', 'completed', 'cancelled'], default: 'open' },

  // Participants (other farmers who want to join)
  participants: [participantSchema],

  createdAt: { type: Date, default: Date.now },
});

// Auto-calculate fare shares before saving
sharedTripSchema.pre('save', function () {
  const accepted = this.participants.filter(p => p.status === 'accepted');
  const totalWeight = this.creatorWeightKg + accepted.reduce((sum, p) => sum + p.weightKg, 0);
  this.usedCapacityKg = totalWeight;

  // Split fare by weight proportion
  if (totalWeight > 0) {
    accepted.forEach(p => {
      p.fareShare = Math.round((p.weightKg / totalWeight) * this.totalFare);
    });
  }

  // Auto-close if capacity is full (>90% used)
  if (this.usedCapacityKg >= this.totalCapacityKg * 0.9 && this.status === 'open') {
    this.status = 'full';
  }
});

// Virtual: creator's fare share
sharedTripSchema.virtual('creatorFareShare').get(function () {
  const accepted = this.participants.filter(p => p.status === 'accepted');
  const totalWeight = this.creatorWeightKg + accepted.reduce((sum, p) => sum + p.weightKg, 0);
  if (totalWeight === 0) return this.totalFare;
  return Math.round((this.creatorWeightKg / totalWeight) * this.totalFare);
});

sharedTripSchema.set('toJSON', { virtuals: true });
sharedTripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SharedTrip', sharedTripSchema);
