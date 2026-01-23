const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// CREATE BOOKING
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { tutorId, startTime, endTime, subject, price, notes } = req.body;

    if (!tutorId || !startTime || !endTime || !subject || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate times
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    // Create booking
    const booking = new Booking({
      tutorId,
      learnerId: req.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      subject,
      price,
      notes,
    });

    await booking.save();

    // Populate tutor and learner info
    await booking.populate('tutorId', 'name email');
    await booking.populate('learnerId', 'name email');

    res.status(201).json({
      message: 'Booking created',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// GET MY BOOKINGS (as learner)
router.get('/learner/bookings', verifyToken, async (req, res) => {
  try {
    const status = req.query.status;
    const query = { learnerId: req.userId };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('tutorId', 'name email')
      .populate('learnerId', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      message: 'Bookings retrieved',
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// GET TUTOR'S BOOKINGS (as tutor)
router.get('/tutor/bookings', verifyToken, async (req, res) => {
  try {
    const status = req.query.status;
    const query = { tutorId: req.userId };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('tutorId', 'name email')
      .populate('learnerId', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      message: 'Bookings retrieved',
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// UPDATE BOOKING STATUS (accept/reject/complete)
router.put('/:bookingId/status', verifyToken, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization (tutor can confirm/complete, learner can cancel)
    if (booking.tutorId.toString() !== req.userId && 
        booking.learnerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    booking.status = status;
    if (cancellationReason && status === 'cancelled') {
      booking.cancellationReason = cancellationReason;
    }

    await booking.save();

    await booking.populate('tutorId', 'name email');
    await booking.populate('learnerId', 'name email');

    res.status(200).json({
      message: 'Booking updated',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// GET AVAILABLE SLOTS FOR TUTOR
router.get('/tutor/:tutorId/availability', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Get all bookings for that tutor on that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      tutorId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime');

    // Generate available slots (1-hour slots, 8am - 8pm)
    const slots = [];
    const hour = new Date(startOfDay);

    for (let i = 8; i < 20; i++) {
      hour.setHours(i, 0, 0, 0);
      const nextHour = new Date(hour);
      nextHour.setHours(i + 1, 0, 0, 0);

      // Check if slot is available
      const isBooked = bookings.some(
        (booking) =>
          hour >= booking.startTime && hour < booking.endTime ||
          nextHour > booking.startTime && nextHour <= booking.endTime
      );

      if (!isBooked) {
        slots.push({
          start: new Date(hour),
          end: new Date(nextHour),
        });
      }
    }

    res.status(200).json({
      message: 'Available slots retrieved',
      data: slots,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots', error: error.message });
  }
});

// DELETE BOOKING
router.delete('/:bookingId', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.learnerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Booking.findByIdAndDelete(req.params.bookingId);

    res.status(200).json({
      message: 'Booking deleted',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

module.exports = router;
