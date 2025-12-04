# Doctor's Appointment System - Backend API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
MONGODB_URI=mongodb://localhost:27017/doctor_appointment_system
JWT_SECRET=your_secure_jwt_secret_key
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

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For macOS (with Homebrew)
brew services start mongodb-community

# For Linux
sudo systemctl start mongod

# For Windows
net start MongoDB
```

### 4. Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (patient/doctor)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Doctors
- `GET /api/doctors` - Get all approved doctors (with filters)
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/user/:userId` - Get doctor profile by user ID
- `PUT /api/doctors/profile` - Update doctor profile (Doctor only)
- `POST /api/doctors/profile/photo` - Upload profile photo (Doctor only)
- `PUT /api/doctors/availability` - Update availability schedule (Doctor only)
- `GET /api/doctors/my/appointments` - Get doctor's appointments (Doctor only)

### Appointments
- `POST /api/appointments` - Book new appointment (Patient only)
- `GET /api/appointments/my` - Get user's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/complete` - Mark as completed (Doctor only)
- `GET /api/appointments/doctor/:doctorId/available-slots` - Get available time slots

### Admin
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/doctors/pending` - Get pending doctor approvals (Admin only)
- `PUT /api/admin/doctors/:userId/approve` - Approve doctor (Admin only)
- `PUT /api/admin/users/:userId/deactivate` - Deactivate user (Admin only)
- `PUT /api/admin/users/:userId/activate` - Activate user (Admin only)
- `DELETE /api/admin/users/:userId` - Delete user (Admin only)
- `GET /api/admin/appointments` - Get all appointments (Admin only)
- `GET /api/admin/stats` - Get system statistics (Admin only)

### Feedback
- `POST /api/feedback` - Submit feedback (Patient only)
- `GET /api/feedback/doctor/:doctorId` - Get doctor's feedback
- `GET /api/feedback/my` - Get user's submitted feedback (Patient only)
- `PUT /api/feedback/:id` - Update feedback (Patient only)
- `DELETE /api/feedback/:id` - Delete feedback (Patient only)

## Database Models

### User
- name, email, password, role (patient/doctor/admin)
- phone, address, isActive, isApproved

### Doctor
- userId (ref to User), specialization, qualification
- experience, consultationFee, bio, profilePhoto
- location, availability (time slots), rating, totalRatings

### Appointment
- patientId, doctorId, appointmentDate, timeSlot
- status (pending/confirmed/completed/cancelled)
- symptoms, notes, prescription, cancelReason

### Feedback
- appointmentId, patientId, doctorId
- rating (1-5), comment

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Uploads

Profile photos are uploaded to `/backend/uploads/` directory and served at `/uploads/:filename`

Maximum file size: 5MB
Allowed formats: JPEG, JPG, PNG, GIF

## Email Notifications

The system sends email notifications for:
- Appointment confirmations
- Appointment cancellations
- Doctor account approvals

Configure your email settings in the `.env` file.

## Error Handling

All API responses follow this format:

Success:
```json
{
  "data": { ... }
}
```

Error:
```json
{
  "message": "Error description",
  "errors": [ ... ] // For validation errors
}
```

## Testing

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL commands

Import the API collection or create requests manually using the endpoints above.