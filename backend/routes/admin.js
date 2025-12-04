import express from 'express';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendDoctorApprovalEmail } from '../utils/email.js';

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, isApproved, isActive } = req.query;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/admin/doctors/pending
// @desc    Get pending doctor approvals
// @access  Private (Admin only)
router.get('/doctors/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      isApproved: false,
      isActive: true,
    }).select('-password');

    const doctorsWithProfiles = await Promise.all(
      pendingDoctors.map(async (user) => {
        const doctorProfile = await Doctor.findOne({ userId: user._id });
        return {
          ...user.toObject(),
          doctorProfile,
        };
      })
    );

    res.json(doctorsWithProfiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pending doctors' });
  }
});

// @route   PUT /api/admin/doctors/:userId/approve
// @desc    Approve a doctor
// @access  Private (Admin only)
router.put('/doctors/:userId/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'Doctor is already approved' });
    }

    user.isApproved = true;
    await user.save();

    // Send approval email
    try {
      await sendDoctorApprovalEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({ message: 'Doctor approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving doctor' });
  }
});

// @route   PUT /api/admin/users/:userId/deactivate
// @desc    Deactivate a user
// @access  Private (Admin only)
router.put('/users/:userId/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot deactivate admin users' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deactivating user' });
  }
});

// @route   PUT /api/admin/users/:userId/activate
// @desc    Activate a user
// @access  Private (Admin only)
router.put('/users/:userId/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error activating user' });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Delete related data
    if (user.role === 'doctor') {
      await Doctor.findOneAndDelete({ userId: user._id });
      await Appointment.deleteMany({ doctorId: user._id });
    } else if (user.role === 'patient') {
      await Appointment.deleteMany({ patientId: user._id });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin only)
router.get('/appointments', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, date } = req.query;

    let query = {};

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
      .populate('doctorId', 'name email')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({
      role: 'doctor',
      isApproved: true,
      isActive: true,
    });
    const pendingDoctors = await User.countDocuments({
      role: 'doctor',
      isApproved: false,
      isActive: true,
    });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

    res.json({
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

export default router;