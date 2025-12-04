// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  address?: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// Doctor types
export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Doctor {
  _id: string;
  userId: User;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  bio?: string;
  profilePhoto?: string;
  location?: string;
  availability: TimeSlot[];
  rating: number;
  totalRatings: number;
  totalAppointments: number;
  createdAt: string;
  updatedAt: string;
}

// Appointment types
export interface AppointmentTimeSlot {
  startTime: string;
  endTime: string;
}

export interface Appointment {
  _id: string;
  patientId: User;
  doctorId: User;
  appointmentDate: string;
  timeSlot: AppointmentTimeSlot;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  symptoms?: string;
  notes?: string;
  prescription?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  address?: string;
}

// Auth Context types
export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
