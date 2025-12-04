import express from 'express';
import { body, validationResult } from 'express-validator';
import Feedback from '../models/Feedback.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for an appointment
// @access  Private (Patient only)
router.post(
  '/',
  protect,
  authorize('patient'),
  [
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { appointmentId, rating, comment } = req.body;

      // Check if appointment exists and belongs to the patient
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to rate this appointment' });
      }

      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: 'Can only rate completed appointments' });
      }

      // Check if feedback already exists
      const existingFeedback = await Feedback.findOne({ appointmentId });

      if (existingFeedback) {
        return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
      }

      // Create feedback
      const feedback = await Feedback.create({
        appointmentId,
        patientId: req.user._id,
        doctorId: appointment.doctorId,
        rating,
        comment,
      });

      // Update doctor's rating
      const doctor = await Doctor.findOne({ userId: appointment.doctorId });

      if (doctor) {
        const totalRatings = doctor.totalRatings + 1;
        const newRating = (doctor.rating * doctor.totalRatings + rating) / totalRatings;

        doctor.rating = Math.round(newRating * 10) / 10;
        doctor.totalRatings = totalRatings;
        await doctor.save();
      }

      const populatedFeedback = await Feedback.findById(feedback._id)
        .populate('patientId', 'name')
        .populate('doctorId', 'name');

      res.status(201).json(populatedFeedback);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
      }
      res.status(500).json({ message: 'Server error submitting feedback' });
    }
  }
);

// @route   GET /api/feedback/doctor/:doctorId
// @desc    Get all feedback for a doctor
// @access  Public
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'name')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
});

// @route   GET /api/feedback/my
// @desc    Get user's submitted feedback
// @access  Private (Patient only)
router.get('/my', protect, authorize('patient'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ patientId: req.user._id })
      .populate('doctorId', 'name')
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching feedback' });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback
// @access  Private (Patient only)
router.put(
  '/:id',
  protect,
  authorize('patient'),
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const feedback = await Feedback.findById(req.params.id);

      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      if (feedback.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this feedback' });
      }

      const { rating, comment } = req.body;

      const oldRating = feedback.rating;

      if (rating !== undefined) feedback.rating = rating;
      if (comment !== undefined) feedback.comment = comment;

      await feedback.save();

      // Update doctor's rating if rating changed
      if (rating !== undefined && rating !== oldRating) {
        const doctor = await Doctor.findOne({ userId: feedback.doctorId });

        if (doctor && doctor.totalRatings > 0) {
          const totalRatings = doctor.totalRatings;
          const currentTotal = doctor.rating * totalRatings;
          const newTotal = currentTotal - oldRating + rating;
          const newRating = newTotal / totalRatings;

          doctor.rating = Math.round(newRating * 10) / 10;
          await doctor.save();
        }
      }

      res.json(feedback);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error updating feedback' });
    }
  }
);

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private (Patient only)
router.delete('/:id', protect, authorize('patient'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    // Update doctor's rating
    const doctor = await Doctor.findOne({ userId: feedback.doctorId });

    if (doctor && doctor.totalRatings > 1) {
      const totalRatings = doctor.totalRatings - 1;
      const currentTotal = doctor.rating * doctor.totalRatings;
      const newTotal = currentTotal - feedback.rating;
      const newRating = newTotal / totalRatings;

      doctor.rating = Math.round(newRating * 10) / 10;
      doctor.totalRatings = totalRatings;
      await doctor.save();
    } else if (doctor && doctor.totalRatings === 1) {
      doctor.rating = 0;
      doctor.totalRatings = 0;
      await doctor.save();
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting feedback' });
  }
});

export default router;