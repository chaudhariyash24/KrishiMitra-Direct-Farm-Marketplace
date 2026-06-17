const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  farmer: { type: String, required: true },
  farmerId: { type: String },
  // KYC
  aadhaar: { type: String },        // masked: XXXX XXXX 1234
  pan: { type: String },            // masked: ABCD***34F
  otpVerified: { type: Boolean, default: false },
  // Documents
  documents: {
    rationCard: { type: String, default: '' },
    incomeCert: { type: String, default: '' },
    landRecord: { type: String, default: '' },
    bankStatement: { type: String, default: '' },
  },
  kycCompleted: { type: Boolean, default: false },
  // CIBIL
  cibilScore: { type: Number, default: 0 },
  cibilBreakdown: {
    paymentHistory: { type: Number, default: 0 },
    creditUtilization: { type: Number, default: 0 },
    creditAge: { type: Number, default: 0 },
    enquiries: { type: Number, default: 0 },
  },
  // Loan Details
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  duration: { type: Number, default: 24 },
  emi: { type: Number },
  rate: { type: Number, default: 7 },
  status: { type: String, default: 'Pending' },
  adminRemarks: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', loanSchema);
