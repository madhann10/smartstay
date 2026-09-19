import axios from 'axios';
import { mockHotels, bookingRows, pricingRows, analyticsData } from '../data/mockData';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

const client = axios.create({ baseURL: getApiBaseUrl(), headers: { 'Content-Type': 'application/json' } });
client.interceptors.request.use((config) => { const token = localStorage.getItem('smartstay_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });

const fallback = async (request, data) => { try { return await request(); } catch { return data; } };

export const hotelApi = {
  // Passes all filter/sort/pagination params to the backend
  getHotels: (params) => fallback(
    () => client.get('/hotels', { params }).then((r) => ({ hotels: r.data.hotels, total: r.data.total, page: r.data.page, pages: r.data.pages })),
    { hotels: mockHotels, total: mockHotels.length, page: 1, pages: 1 }
  ),
  getHotelById: (id) => fallback(
    () => client.get(`/hotels/${id}`).then((r) => r.data.hotel),
    mockHotels.find((hotel) => hotel._id === id)
  ),
};

export const bookingApi = {
  // Create a booking — backend calculates price from DB
  createBooking: (payload) => client.post('/bookings', payload).then((r) => r.data),
  // Get logged-in user's bookings
  getBookings: (params) => client.get('/bookings', { params }).then((r) => r.data),
  // Get a single booking
  getBookingById: (bookingId) => client.get(`/bookings/${bookingId}`).then((r) => r.data),
  // Get invoice data for a booking
  getInvoice: (bookingId) => client.get(`/bookings/${bookingId}/invoice`).then((r) => r.data),
  // Resend invoice to registered email address
  resendInvoice: (bookingId) => client.post(`/bookings/${bookingId}/resend-invoice`).then((r) => r.data),
};

export const pricingApi = { getPricing: () => fallback(() => client.get('/pricing').then((r) => r.data.pricing), pricingRows), predictRoom: (payload) => client.post('/pricing/predict-room', payload).then((r) => r.data) };
export const analyticsApi = { getAnalytics: () => fallback(() => client.get('/analytics').then((r) => r.data), { trends: analyticsData }) };
export const authApi = {
  register: (payload) => client.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => client.post('/auth/login', payload).then((r) => r.data),
  loginWithGoogle: (credential, isDevMock) => client.post('/auth/google', { credential, isDevMock }).then((r) => r.data),
  sendOtp: (phone, isRegistration = false, email = null) => client.post('/auth/send-otp', { phone, isRegistration, email }).then((r) => r.data),
  verifyOtp: (phone, otp) => client.post('/auth/verify-otp', { phone, otp }).then((r) => r.data),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, newPassword) => client.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),
  changePassword: (currentPassword, newPassword) => client.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
};
export const userApi = {
  getMe: () => client.get('/users/me').then((r) => r.data.user),
  updateMe: (payload) => client.patch('/users/me', payload).then((r) => r.data.user),
};
export const adminApi = {
  getOverviewStats: () => client.get('/admin/overview').then((r) => r.data),
  getHotels: (params) => client.get('/admin/hotels', { params }).then((r) => r.data),
  createHotel: (payload) => client.post('/admin/hotels', payload).then((r) => r.data),
  getUsers: (params) => client.get('/admin/users', { params }).then((r) => r.data),
  getRooms: (params) => client.get('/admin/rooms', { params }).then((r) => r.data),
  createRoom: (payload) => client.post('/admin/rooms', payload).then((r) => r.data),
  getBookings: (params) => client.get('/admin/bookings', { params }).then((r) => r.data),
  getPricing: (params) => client.get('/admin/pricing', { params }).then((r) => r.data),
  getLoginActivity: (params) => client.get('/admin/login-activity', { params }).then((r) => r.data),
  getActiveUsers: () => client.get('/admin/active-users').then((r) => r.data),
  getLoginStatistics: () => client.get('/admin/login-statistics').then((r) => r.data),
  getDailyLoginStatistics: (params) => client.get('/admin/login-statistics/daily', { params }).then((r) => r.data),
};
export default client;
