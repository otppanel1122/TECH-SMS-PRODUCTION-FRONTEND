import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://techsms.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};

// ============ ADMIN ============
export const adminAPI = {
  getUsers: (page = 1, perPage = 20) => api.get('/api/admin/users', { params: { page, per_page: perPage } }),
  createUser: (data) => api.post('/api/admin/users/create', data),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  changeRole: (userId, role) => api.post(`/api/admin/users/${userId}/role`, { role }),
  banUser: (userId) => api.post(`/api/admin/users/${userId}/ban`),
  unbanUser: (userId) => api.post(`/api/admin/users/${userId}/unban`),
  getStats: () => api.get('/api/admin/stats'),
  getUserStats: () => api.get('/api/admin/user-stats'),
};

// ============ NUMBERS ============
export const numbersAPI = {
  allocate: (data) => api.post('/api/numbers/allocate', data),
  getMyNumbers: () => api.get('/api/numbers/my-numbers'),
  deallocate: (numberId) => api.delete(`/api/numbers/deallocate/${numberId}`),
  getEvents: () => api.get('/api/numbers/allocation-events'),
  deleteEvent: (eventId) => api.delete(`/api/numbers/delete-event/${eventId}`),
};

// ============ CDR ============
export const cdrAPI = {
  getRecords: (params) => api.get('/api/cdr/records', { params }),
  storeRecord: (record) => api.post('/api/cdr/store', { record }),
};

// ============ DASHBOARD ============
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

export default api;
