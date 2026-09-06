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
  getUsers: async (page = 1, perPage = 20) => {
    try {
      const response = await api.get('/api/admin/users', { 
        params: { page, per_page: perPage } 
      });
      return response;
    } catch (error) {
      // Return structured error response
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to fetch users',
          data: { users: [], total: 0, page: 1, per_page: 20, total_pages: 0 }
        }
      };
    }
  },
  createUser: async (data) => {
    try {
      const response = await api.post('/api/admin/users/create', data);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to create user'
        }
      };
    }
  },
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to delete user'
        }
      };
    }
  },
  changeRole: async (userId, role) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/role`, { role });
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to change role'
        }
      };
    }
  },
  banUser: async (userId) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/ban`);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to ban user'
        }
      };
    }
  },
  unbanUser: async (userId) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/unban`);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to unban user'
        }
      };
    }
  },
  getStats: async () => {
    try {
      const response = await api.get('/api/admin/stats');
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get stats',
          data: {}
        }
      };
    }
  },
  getUserStats: async () => {
    try {
      const response = await api.get('/api/admin/user-stats');
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get user stats',
          data: { users: [], total: 0, total_numbers: 0 }
        }
      };
    }
  },
};

// ============ NUMBERS ============
export const numbersAPI = {
  allocate: async (data) => {
    try {
      const response = await api.post('/api/numbers/allocate', data);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to allocate numbers',
          data: { allocated_numbers: [], count: 0 }
        }
      };
    }
  },
  getMyNumbers: async () => {
    try {
      const response = await api.get('/api/numbers/my-numbers');
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get numbers',
          data: { numbers: [], count: 0 }
        }
      };
    }
  },
  deallocate: async (numberId) => {
    try {
      const response = await api.delete(`/api/numbers/deallocate/${numberId}`);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to deallocate number'
        }
      };
    }
  },
  getEvents: async () => {
    try {
      const response = await api.get('/api/numbers/allocation-events');
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get events',
          data: { events: [], count: 0 }
        }
      };
    }
  },
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/api/numbers/delete-event/${eventId}`);
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to delete event'
        }
      };
    }
  },
};

// ============ CDR ============
export const cdrAPI = {
  getRecords: async (params) => {
    try {
      const response = await api.get('/api/cdr/records', { params });
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get CDR records',
          data: { records: [], total: 0, page: 1, per_page: 25, total_pages: 0 }
        }
      };
    }
  },
  storeRecord: async (record) => {
    try {
      const response = await api.post('/api/cdr/store', { record });
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to store CDR record'
        }
      };
    }
  },
};

// ============ DASHBOARD ============
export const dashboardAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response;
    } catch (error) {
      return {
        data: {
          success: false,
          error: error.response?.data?.error || error.message || 'Failed to get dashboard stats',
          data: { total_numbers: 0, total_users: 0, total_ranges: 0, today_sms: 0 }
        }
      };
    }
  },
};

export default api;
