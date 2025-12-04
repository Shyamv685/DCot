import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic for API calls
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries: number = 3, delay: number = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = error.response?.status >= 500 || error.code === 'ECONNABORTED' || !error.response;

      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      console.log(`API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => retryApiCall(() => api.post('/auth/register', data)),
  login: (data: any) => retryApiCall(() => api.post('/auth/login', data)),
  getProfile: () => retryApiCall(() => api.get('/auth/me')),
};

// Doctor API
export const doctorAPI = {
  getAllDoctors: (params?: any) => api.get('/doctors', { params }),
  getDoctorById: (id: string) => api.get(`/doctors/${id}`),
  getDoctorByUserId: (userId: string) => api.get(`/doctors/user/${userId}`),
  updateProfile: (data: any) => api.put('/doctors/profile', data),
  uploadPhoto: (formData: FormData) => 
    api.post('/doctors/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateAvailability: (data: any) => api.put('/doctors/availability', data),
  getMyAppointments: (params?: any) => api.get('/doctors/my/appointments', { params }),
};

// Appointment API
export const appointmentAPI = {
  bookAppointment: (data: any) => api.post('/appointments', data),
  getMyAppointments: (params?: any) => api.get('/appointments/my', { params }),
  getAppointmentById: (id: string) => api.get(`/appointments/${id}`),
  cancelAppointment: (id: string, data?: any) => api.put(`/appointments/${id}/cancel`, data),
  completeAppointment: (id: string, data?: any) => api.put(`/appointments/${id}/complete`, data),
  getAvailableSlots: (doctorId: string, date: string) => 
    api.get(`/appointments/doctor/${doctorId}/available-slots`, { params: { date } }),
};

// Admin API
export const adminAPI = {
  getAllUsers: (params?: any) => api.get('/admin/users', { params }),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  approveDoctor: (userId: string) => api.put(`/admin/doctors/${userId}/approve`),
  deactivateUser: (userId: string) => api.put(`/admin/users/${userId}/deactivate`),
  activateUser: (userId: string) => api.put(`/admin/users/${userId}/activate`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  getAllAppointments: (params?: any) => api.get('/admin/appointments', { params }),
  getStats: () => api.get('/admin/stats'),
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (data: any) => api.post('/feedback', data),
  getDoctorFeedback: (doctorId: string) => api.get(`/feedback/doctor/${doctorId}`),
  getMyFeedback: () => api.get('/feedback/my'),
  updateFeedback: (id: string, data: any) => api.put(`/feedback/${id}`, data),
  deleteFeedback: (id: string) => api.delete(`/feedback/${id}`),
};

export default api;
