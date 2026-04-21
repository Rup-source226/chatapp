import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllUsers: (params) => api.get('/auth/users', { params }),
};

// Messages API
export const messagesAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getMessages: (conversationId, params) => 
    api.get(`/messages/conversation/${conversationId}`, { params }),
  getConversation: (userId) => api.get(`/messages/conversation/user/${userId}`),
  markAsRead: (conversationId) => 
    api.put(`/messages/conversation/${conversationId}/read`),
  getUnreadCount: () => api.get('/messages/unread'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

export default api;
