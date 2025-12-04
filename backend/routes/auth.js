import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { mockUsers, mockDoctors } from '../config/db.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['patient', 'doctor']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role, phone, address } = req.body;

      // Check if user already exists (try MongoDB first, then mock)
      let userExists;
      try {
        userExists = await User.findOne({ email });
      } catch (dbError) {
        // If MongoDB fails, check mock database
        userExists = mockUsers.get(email);
      }

      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user (try MongoDB first, then mock)
      let user;
      try {
        user = await User.create({
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          address,
        });
      } catch (dbError) {
        // If MongoDB fails, use mock database
        const userId = Date.now().toString();
        user = {
          _id: userId,
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          address,
          isApproved: role === 'patient', // Patients auto-approved
          isActive: true,
          createdAt: new Date(),
        };
        mockUsers.set(email, user);
      }

      // If doctor, create doctor profile
      if (role === 'doctor') {
        const { specialization, qualification, experience, consultationFee, location } = req.body;

        if (!specialization || !qualification || experience == null || consultationFee == null) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({
            message: 'Doctor registration requires specialization, qualification, experience, and consultation fee',
          });
        }

        try {
          await Doctor.create({
            userId: user._id,
            specialization,
            qualification,
            experience,
            consultationFee,
            location,
          });
        } catch (doctorError) {
          // If doctor creation fails, delete the user and return specific error
          await User.findByIdAndDelete(user._id);
          console.error('Doctor profile creation failed:', doctorError);
          return res.status(400).json({
            message: 'Failed to create doctor profile. Please check your input data and try again.',
          });
        }
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Your account has been deactivated' });
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized' });
  }
});

export default router;
