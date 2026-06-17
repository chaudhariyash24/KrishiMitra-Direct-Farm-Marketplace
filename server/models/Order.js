const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },       // listed price per qtl
  offeredPrice: { type: Number },                 // buyer's offered price per qtl
  totalAmount: { type: Number },
  // Buyer info
  buyerName: { type: String, required: true },
  buyerPhone: { type: String },
  buyerId: { type: String },
  buyerLoc: { type: String },
  // Seller info  
  sellerName: { type: String, required: true },
  sellerPhone: { type: String },
  sellerId: { type: String },
  sellerLoc: { type: String },
  // Offer & Delivery flow
  // offer-pending → accepted/rejected → payment-held → in-transit → unload-pending → delivered / cancelled
  status: { type: String, default: 'offer-pending', enum: [
    'offer-pending', 'accepted', 'rejected',
    'payment-held', 'in-transit', 'unload-pending', 'delivered', 'cancelled'
  ]},
  rejectedReason: { type: String },
  acceptedAt: { type: Date },
  transportBooked: { type: Boolean, default: false },
  shippedAt: { type: Date },
  transportDetails: {
    vehicle: String,
    driver: String,
    fare: Number,
    bookingId: String,
  },

  // ===== ESCROW SYSTEM =====
  escrow: {
    // held → payment-confirmed → awaiting-unload → released / disputed / refunded
    status: { type: String, default: 'pending', enum: [
      'pending', 'held', 'payment-confirmed',
      'awaiting-unload', 'released', 'disputed', 'refunded'
    ]},
    heldAt: { type: Date },
    // Buyer pays to platform
    buyerPaid: { type: Boolean, default: false },
    buyerPaidAt: { type: Date },
    // Farmer sees payment is secured
    farmerSeesPayment: { type: Boolean, default: false },
    // Unload approval — farmer allows unloading after seeing payment
    farmerApprovedUnload: { type: Boolean, default: false },
    farmerApprovedUnloadAt: { type: Date },
    // Buyer confirms goods received
    buyerConfirmedReceived: { type: Boolean, default: false },
    buyerConfirmedReceivedAt: { type: Date },
    // Release
    releasedAt: { type: Date },
    // Dispute
    disputeReason: { type: String },
    disputedBy: { type: String },
    disputedAt: { type: Date },
    resolvedAt: { type: Date },
    resolvedAction: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
