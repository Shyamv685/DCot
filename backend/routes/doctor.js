import express from 'express';
import { body, validationResult } from 'express-validator';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize, checkDoctorApproval } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all approved doctors with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialization, location, minFee, maxFee, sortBy } = req.query;

    // Build query
    let query = {};
    
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    // Build sort
    let sort = {};
    if (sortBy === 'rating') {
      sort.rating = -1;
    } else if (sortBy === 'fee-low') {
      sort.consultationFee = 1;
    } else if (sortBy === 'fee-high') {
      sort.consultationFee = -1;
    } else if (sortBy === 'experience') {
      sort.experience = -1;
    } else {
      sort.createdAt = -1;
    }

    const doctors = await Doctor.find(query)
      .populate({
        path: 'userId',
        match: { isApproved: true, isActive: true },
        select: 'name email phone address',
      })
      .sort(sort);

    // Filter out doctors whose userId is null (not approved or not active)
    const approvedDoctors = doctors.filter(doctor => doctor.userId !== null);

    res.json(approvedDoctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      'userId',
      'name email phone address isApproved'
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching doctor' });
  }
});

// @route   GET /api/doctors/user/:userId
// @desc    Get doctor profile by user ID
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.userId }).populate(
      'userId',
      'name email phone address isApproved'
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching doctor profile' });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put(
  '/profile',
  protect,
  authorize('doctor'),
  checkDoctorApproval,
  [
    body('specialization').optional().trim().notEmpty(),
    body('qualification').optional().trim().notEmpty(),
    body('experience').optional().isInt({ min: 0 }),
    body('consultationFee').optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      const {
        specialization,
        qualification,
        experience,
        consultationFee,
        bio,
        location,
      } = req.body;

      if (specialization) doctor.specialization = specialization;
      if (qualification) doctor.qualification = qualification;
      if (experience !== undefined) doctor.experience = experience;
      if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
      if (bio) doctor.bio = bio;
      if (location) doctor.location = location;

      await doctor.save();

      const updatedDoctor = await Doctor.findById(doctor._id).populate(
        'userId',
        'name email phone address'
      );

      res.json(updatedDoctor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error updating profile' });
    }
  }
);

// @route   POST /api/doctors/profile/photo
// @desc    Upload doctor profile photo
// @access  Private (Doctor only)
router.post(
  '/profile/photo',
  protect,
  authorize('doctor'),
  checkDoctorApproval,
  upload.single('profilePhoto'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
      }

      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      doctor.profilePhoto = `/uploads/${req.file.filename}`;
      await doctor.save();

      res.json({ profilePhoto: doctor.profilePhoto });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error uploading photo' });
    }
  }
);

// @route   PUT /api/doctors/availability
// @desc    Update doctor availability schedule
// @access  Private (Doctor only)
router.put(
  '/availability',
  protect,
  authorize('doctor'),
  checkDoctorApproval,
  async (req, res) => {
    try {
      const { availability } = req.body;

      if (!Array.isArray(availability)) {
        return res.status(400).json({ message: 'Availability must be an array' });
      }

      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      doctor.availability = availability;
      await doctor.save();

      res.json(doctor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error updating availability' });
    }
  }
);

// @route   GET /api/doctors/my/appointments
// @desc    Get doctor's appointments
// @access  Private (Doctor only)
router.get(
  '/my/appointments',
  protect,
  authorize('doctor'),
  checkDoctorApproval,
  async (req, res) => {
    try {
      const { status, date } = req.query;

      let query = { doctorId: req.user._id };

      if (status) {
        query.status = status;
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.appointmentDate = { $gte: startDate, $lt: endDate };
      }

      const appointments = await Appointment.find(query)
        .populate('patientId', 'name email phone')
        .sort({ appointmentDate: 1, 'timeSlot.startTime': 1 });

      res.json(appointments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error fetching appointments' });
    }
  }
);

export default router;