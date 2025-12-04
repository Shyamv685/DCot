# Doctor's Appointment System - MERN Stack

A comprehensive healthcare management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that enables patients to book appointments with doctors, doctors to manage their schedules, and administrators to oversee the entire system.

## 🌟 Features

### For Patients
- **User Registration & Login** - Secure authentication with JWT
- **Browse Doctors** - Search and filter doctors by specialization, location, fees, and ratings
- **Book Appointments** - Select available time slots and book appointments
- **Appointment Management** - View upcoming and past appointments
- **Doctor Reviews** - Rate and review doctors after appointments
- **Dashboard** - Track appointment history and manage bookings

### For Doctors
- **Profile Management** - Update specialization, qualifications, fees, and bio
- **Availability Schedule** - Set weekly availability with custom time slots
- **Appointment Management** - View and manage patient appointments
- **Complete Appointments** - Add notes and prescriptions
- **Dashboard** - Track appointments, ratings, and statistics

### For Administrators
- **User Management** - View, activate, deactivate, and delete users
- **Doctor Approvals** - Review and approve doctor registrations
- **Appointment Logs** - Monitor all appointments in the system
- **System Statistics** - View key metrics and analytics
- **Dashboard** - Comprehensive system overview

### Additional Features
- **Email Notifications** - Automated emails for appointment confirmations and cancellations
- **Real-time Availability** - Prevent double bookings with slot validation
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Role-based Access Control** - Secure routes based on user roles
- **Search & Filter** - Advanced filtering for finding the right doctor

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn-ui** - Beautiful component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **date-fns** - Date manipulation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending
- **Multer** - File uploads

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or pnpm package manager
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shadcn-ui
```

### 2. Install Frontend Dependencies

```bash
pnpm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure Environment Variables

#### Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/doctor_appointment_system
JWT_SECRET=your_secure_jwt_secret_key_change_this
PORT=5000
NODE_ENV=development

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Doctor Appointment System <noreply@doctorappointment.com>

FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

#### Frontend Configuration

The frontend `.env` file is already created with:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 6. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

### 7. Start the Frontend Development Server

In a new terminal:

```bash
cd shadcn-ui
pnpm run dev
```

The frontend will run on `http://localhost:5173`

## 👥 User Roles & Test Accounts

### Creating Test Accounts

1. **Admin Account** - Must be created directly in MongoDB:

```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...", // Use bcrypt to hash "admin123"
  role: "admin",
  isActive: true,
  isApproved: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

2. **Doctor Account** - Register through the UI:
   - Go to `/register`
   - Select "Doctor" tab
   - Fill in all required information
   - Wait for admin approval

3. **Patient Account** - Register through the UI:
   - Go to `/register`
   - Select "Patient" tab
   - Fill in required information
   - Automatically approved

## 📱 Usage Guide

### For Patients

1. **Register/Login** - Create an account or sign in
2. **Browse Doctors** - Navigate to "Find Doctors" to see all available doctors
3. **Filter & Search** - Use filters to find doctors by specialization, location, or fees
4. **View Doctor Profile** - Click on a doctor to see their full profile and reviews
5. **Book Appointment** - Select a date and available time slot
6. **Manage Appointments** - View and cancel appointments from your dashboard
7. **Rate Doctors** - After completed appointments, leave ratings and reviews

### For Doctors

1. **Register** - Sign up as a doctor (requires admin approval)
2. **Wait for Approval** - Admin will review and approve your account
3. **Setup Profile** - Complete your profile with specialization, fees, and bio
4. **Set Availability** - Configure your weekly schedule with available time slots
5. **Manage Appointments** - View today's and upcoming appointments
6. **Complete Appointments** - Add notes and prescriptions after consultations

### For Administrators

1. **Login** - Use admin credentials
2. **Review Pending Doctors** - Approve or reject doctor registrations
3. **Manage Users** - Activate, deactivate, or delete user accounts
4. **Monitor Appointments** - View all appointments in the system
5. **View Statistics** - Check system metrics and analytics

## 🗂️ Project Structure

```
shadcn-ui/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & upload middleware
│   ├── utils/           # Email utilities
│   └── server.js        # Express server
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Login & Register
│   │   ├── patient/     # Patient components
│   │   ├── doctor/      # Doctor components
│   │   ├── admin/       # Admin components
│   │   └── shared/      # Shared components
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── context/         # React context (Auth)
│   └── App.tsx          # Main app with routing
└── README.md
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Role-based Access Control** - Protected routes based on user roles
- **Input Validation** - Server-side validation for all inputs
- **CORS Configuration** - Controlled cross-origin requests
- **Environment Variables** - Sensitive data stored securely

## 📧 Email Notifications

The system sends automated emails for:
- Appointment confirmations
- Appointment cancellations
- Doctor account approvals

Configure your email settings in `backend/.env` to enable this feature.

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the `MONGODB_URI` in `.env`
- Verify MongoDB port (default: 27017)

### Email Not Sending
- Verify email credentials in `.env`
- For Gmail, use an App Password instead of your regular password
- Check SMTP settings

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will automatically use the next available port

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Doctor Endpoints
- `GET /api/doctors` - Get all doctors (with filters)
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/profile` - Update doctor profile
- `PUT /api/doctors/availability` - Update availability

### Appointment Endpoints
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/my` - Get user's appointments
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Complete appointment

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/doctors/pending` - Get pending doctors
- `PUT /api/admin/doctors/:userId/approve` - Approve doctor
- `GET /api/admin/stats` - Get system statistics

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Development Team Roles

This project was designed for a 3-person team:

1. **Frontend Developer** - React.js, UI/UX, API integration
2. **Backend Developer** - Node.js, Express.js, API development
3. **Database/Testing Manager** - MongoDB, schema design, testing

## 🎯 Future Enhancements

- Real-time chat between doctors and patients
- Payment integration (Stripe/PayPal)
- Prescription upload/download
- Video consultation
- SMS notifications
- Mobile app (React Native)
- Advanced analytics dashboard
- Multi-language support

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

---

Built with ❤️ using MERN Stack#   D C o t  
 