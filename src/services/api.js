import axios from 'axios';

// Production API URL will be set via environment variable
// Fallback for local development only
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout for mobile
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🟡 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('🟡 Request config:', config);
    return config;
  },
  (error) => {
    console.error('🔴 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    console.log('🟢 Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('🔴 API Response Error:', error.response?.data || error.message);
    console.error('🔴 Full error:', error);
    return Promise.reject(error);
  }
);

export const rosterAPI = {
  // Get current roster
  getCurrentRoster: async () => {
    try {
      const response = await api.get('/api/roster/current');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch roster'
      };
    }
  },

  // Get specific roster by ID
  getRoster: async (id) => {
    try {
      const response = await api.get(`/api/roster/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch roster'
      };
    }
  },

  // Create new roster
  createRoster: async (name, data, activeDays) => {
    try {
      const response = await api.post('/api/roster', { name, data, activeDays });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create roster'
      };
    }
  },

  // Update existing roster
  updateRoster: async (id, name, data, activeDays) => {
    try {
      const response = await api.put(`/api/roster/${id}`, { name, data, activeDays });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update roster'
      };
    }
  },

  // Get all rosters (admin only)
  getAllRosters: async () => {
    try {
      const response = await api.get('/api/rosters');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch rosters'
      };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Server is not responding'
      };
    }
  }
};

export const authAPI = {
  // Admin login
  login: async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  // Carer login (no password required)
  carerLogin: async (name) => {
    try {
      const response = await api.post('/api/auth/carer-login', { name });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Carer login failed'
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed'
      };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password'
      };
    }
  }
};

export default api;