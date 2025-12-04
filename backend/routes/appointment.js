import express from 'express';
import { body, validationResult } from 'express-validator';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendAppointmentConfirmation, sendAppointmentCancellation } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/appointments
// @desc    Book a new appointment
// @access  Private (Patient only)
router.post(
  '/',
  protect,
  authorize('patient'),
  [
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('timeSlot.startTime').notEmpty().withMessage('Start time is required'),
    body('timeSlot.endTime').notEmpty().withMessage('End time is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;

      // Check if doctor exists and is approved
      const doctor = await Doctor.findOne({ userId: doctorId }).populate('userId');
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      if (!doctor.userId.isApproved) {
        return res.status(400).json({ message: 'Doctor is not approved yet' });
      }

      // Check if appointment date is in the future
      const appointmentDateTime = new Date(appointmentDate);
      if (appointmentDateTime < new Date()) {
        return res.status(400).json({ message: 'Cannot book appointments in the past' });
      }

      // Check for existing appointment at the same time
      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate: appointmentDateTime,
        'timeSlot.startTime': timeSlot.startTime,
        status: { $in: ['pending', 'confirmed'] },
      });

      if (existingAppointment) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Create appointment
      const appointment = await Appointment.create({
        patientId: req.user._id,
        doctorId,
        appointmentDate: appointmentDateTime,
        timeSlot,
        symptoms,
        status: 'confirmed',
      });

      // Populate appointment details
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name email');

      // Update doctor's total appointments
      doctor.totalAppointments += 1;
      await doctor.save();

      // Send confirmation email
      try {
        await sendAppointmentConfirmation(req.user.email, {
          patientName: req.user.name,
          doctorName: doctor.userId.name,
          specialization: doctor.specialization,
          date: appointmentDateTime.toLocaleDateString(),
          time: `${timeSlot.startTime} - ${timeSlot.endTime}`,
          location: doctor.location || 'To be confirmed',
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      res.status(201).json(populatedAppointment);
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }
      res.status(500).json({ message: 'Server error booking appointment' });
    }
  }
);

// @route   GET /api/appointments/my
// @desc    Get user's appointments
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};

    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email')
      .sort({ appointmentDate: -1 });

    // Populate doctor details
    const appointmentsWithDoctorDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const doctor = await Doctor.findOne({ userId: appointment.doctorId._id });
        return {
          ...appointment.toObject(),
          doctorDetails: doctor,
        };
      })
    );

    res.json(appointmentsWithDoctorDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      appointment.patientId._id.toString() !== req.user._id.toString() &&
      appointment.doctorId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    const doctor = await Doctor.findOne({ userId: appointment.doctorId._id });

    res.json({
      ...appointment.toObject(),
      doctorDetails: doctor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching appointment' });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      appointment.patientId._id.toString() !== req.user._id.toString() &&
      appointment.doctorId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: `Cannot cancel ${appointment.status} appointment` });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = cancelReason;
    await appointment.save();

    // Send cancellation email
    try {
      const doctor = await Doctor.findOne({ userId: appointment.doctorId._id });
      await sendAppointmentCancellation(appointment.patientId.email, {
        patientName: appointment.patientId.name,
        doctorName: appointment.doctorId.name,
        date: appointment.appointmentDate.toLocaleDateString(),
        time: `${appointment.timeSlot.startTime} - ${appointment.timeSlot.endTime}`,
        reason: cancelReason,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling appointment' });
  }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Mark appointment as completed
// @access  Private (Doctor only)
router.put(
  '/:id/complete',
  protect,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { notes, prescription } = req.body;

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      if (appointment.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to complete this appointment' });
      }

      if (appointment.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only confirmed appointments can be completed' });
      }

      appointment.status = 'completed';
      if (notes) appointment.notes = notes;
      if (prescription) appointment.prescription = prescription;

      await appointment.save();

      res.json(appointment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error completing appointment' });
    }
  }
);

// @route   GET /api/appointments/doctor/:doctorId/available-slots
// @desc    Get available time slots for a doctor on a specific date
// @access  Public
router.get('/doctor/:doctorId/available-slots', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const doctor = await Doctor.findOne({ userId: req.params.doctorId });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Get doctor's availability for the day
    const dayAvailability = doctor.availability.filter(
      (slot) => slot.day === dayName && slot.isAvailable
    );

    if (dayAvailability.length === 0) {
      return res.json({ availableSlots: [] });
    }

    // Get booked appointments for the date
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const bookedAppointments = await Appointment.find({
      doctorId: req.params.doctorId,
      appointmentDate: { $gte: startDate, $lt: endDate },
      status: { $in: ['pending', 'confirmed'] },
    });

    const bookedSlots = bookedAppointments.map((apt) => apt.timeSlot.startTime);

    // Generate available slots
    const availableSlots = dayAvailability.map((slot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: bookedSlots.includes(slot.startTime),
    }));

    res.json({ availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching available slots' });
  }
});

export default router;