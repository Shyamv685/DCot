import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send appointment confirmation email
export const sendAppointmentConfirmation = async (to, appointmentDetails) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: 'Appointment Confirmation - Doctor Appointment System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmed</h2>
          <p>Dear ${appointmentDetails.patientName},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
            <p><strong>Specialization:</strong> ${appointmentDetails.specialization}</p>
            <p><strong>Date:</strong> ${appointmentDetails.date}</p>
            <p><strong>Time:</strong> ${appointmentDetails.time}</p>
            <p><strong>Location:</strong> ${appointmentDetails.location}</p>
          </div>
          <p>Please arrive 10 minutes before your scheduled time.</p>
          <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
          <p>Best regards,<br>Doctor Appointment System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
  }
};

// Send appointment cancellation email
export const sendAppointmentCancellation = async (to, appointmentDetails) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: 'Appointment Cancelled - Doctor Appointment System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Appointment Cancelled</h2>
          <p>Dear ${appointmentDetails.patientName},</p>
          <p>Your appointment has been cancelled:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
            <p><strong>Date:</strong> ${appointmentDetails.date}</p>
            <p><strong>Time:</strong> ${appointmentDetails.time}</p>
            ${appointmentDetails.reason ? `<p><strong>Reason:</strong> ${appointmentDetails.reason}</p>` : ''}
          </div>
          <p>You can book a new appointment at your convenience.</p>
          <p>Best regards,<br>Doctor Appointment System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment cancellation email sent successfully');
  } catch (error) {
    console.error('Error sending appointment cancellation email:', error);
  }
};

// Send doctor approval email
export const sendDoctorApprovalEmail = async (to, doctorName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: 'Doctor Account Approved - Doctor Appointment System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Account Approved</h2>
          <p>Dear Dr. ${doctorName},</p>
          <p>Congratulations! Your doctor account has been approved.</p>
          <p>You can now log in and start managing your profile and appointments.</p>
          <p>Best regards,<br>Doctor Appointment System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Doctor approval email sent successfully');
  } catch (error) {
    console.error('Error sending doctor approval email:', error);
  }
};