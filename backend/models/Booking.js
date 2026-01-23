const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for finding bookings by tutor or learner
BookingSchema.index({ tutorId: 1, createdAt: -1 });
BookingSchema.index({ learnerId: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
