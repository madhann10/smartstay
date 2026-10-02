import axios from 'axios';
import { mockHotels, bookingRows, pricingRows, analyticsData } from '../data/mockData';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
  }
  // If in browser and on dev server, use relative /api to benefit from Vite proxy
  if (typeof window !== 'undefined' && window.location) {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const client = axios.create({ baseURL: getApiBaseUrl(), headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartstay_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If authenticated request receives 401, handle session expiration
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthRoute && localStorage.getItem('smartstay_token')) {
        console.warn('Session expired or unauthorized. Clearing credentials.');
        localStorage.removeItem('smartstay_token');
        localStorage.removeItem('smartstay_user');
      }
    }
    return Promise.reject(error);
  }
);

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

export const pricingApi = {
  getPricing: () => fallback(() => client.get('/pricing').then((r) => r.data.pricing), pricingRows),
  predictRoom: (payload) => client.post('/pricing/predict-room', payload).then((r) => r.data),
};

export const analyticsApi = {
  getAnalytics: () => client.get('/admin/analytics').then((r) => r.data).catch(() => ({ trends: analyticsData })),
};

export const authApi = {
  register: (payload) => client.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => client.post('/auth/login', payload).then((r) => r.data),
  loginWithGoogle: (credential, isDevMock) => client.post('/auth/google', { credential, isDevMock }).then((r) => r.data),
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
  getProfile: () => client.get('/admin/profile').then((r) => r.data),
  
  // Hotels
  getHotels: (params) => client.get('/admin/hotels', { params }).then((r) => r.data),
  getHotelById: (id) => client.get(`/admin/hotels/${id}`).then((r) => r.data),
  createHotel: (payload) => client.post('/admin/hotels', payload).then((r) => r.data),
  updateHotel: (id, payload) => client.put(`/admin/hotels/${id}`, payload).then((r) => r.data),
  deleteHotel: (id) => client.delete(`/admin/hotels/${id}`).then((r) => r.data),

  // Users
  getUsers: (params) => client.get('/admin/users', { params }).then((r) => r.data),

  // Rooms
  getRooms: (params) => client.get('/admin/rooms', { params }).then((r) => r.data),
  createRoom: (payload) => client.post('/admin/rooms', payload).then((r) => r.data),
  updateRoom: (hotelId, roomId, payload) => client.put(`/admin/rooms/${hotelId}/${roomId}`, payload).then((r) => r.data),
  deleteRoom: (hotelId, roomId) => client.delete(`/admin/rooms/${hotelId}/${roomId}`).then((r) => r.data),

  // Bookings
  getBookings: (params) => client.get('/admin/bookings', { params }).then((r) => r.data),
  getBookingById: (id) => client.get(`/admin/bookings/${id}`).then((r) => r.data),
  updateBookingStatus: (id, status) => client.put(`/admin/bookings/${id}/status`, { status }).then((r) => r.data),
  cancelBooking: (id) => client.delete(`/admin/bookings/${id}`).then((r) => r.data),

  // Pricing
  getPricing: (params) => client.get('/admin/pricing', { params }).then((r) => r.data),
  updateRoomPrice: (hotelId, roomId, payload) => client.put(`/admin/pricing/${hotelId}/${roomId}`, payload).then((r) => r.data),

  // Analytics
  getAnalytics: (params) => client.get('/admin/analytics', { params }).then((r) => r.data),

  // Login Activity & Statistics
  getLoginActivity: (params) => client.get('/admin/login-activity', { params }).then((r) => r.data),
  getActiveUsers: () => client.get('/admin/active-users').then((r) => r.data),
  getLoginStatistics: () => client.get('/admin/login-statistics').then((r) => r.data),
  getDailyLoginStatistics: (params) => client.get('/admin/login-statistics/daily', { params }).then((r) => r.data),
};
export default client;
