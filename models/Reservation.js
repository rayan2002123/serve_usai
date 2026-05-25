const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema({
  fullName: String,

  sex: {
    type: String,
    enum: ['M', 'F']
  },

  comment: String
})

const reservationSchema = new mongoose.Schema({
  reservationCode: String,

  email: String,

  reservationType: {
    type: String,
    enum: ['partial', 'full']
  },

  participants: [participantSchema],

  totalAmount: Number,

  paidAmount: Number,

  remainingAmount: Number,

  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },

  /* ✅ AJOUT CRUCIAL */
  processedStripeSessions: {
    type: [String],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model(
  'Reservation',
  reservationSchema
)