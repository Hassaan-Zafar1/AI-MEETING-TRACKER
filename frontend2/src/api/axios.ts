import axios from 'axios';

// Create an axios instance with default settings
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: runs before every request
// Automatically adds the JWT token to every request header
api.interceptors.request.use((config) => {
  // Get user data from localStorage (where we store it after login)
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      // Add Authorization header: "Bearer <token>"
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// INTERCEPTOR: runs after every response
// Handles 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response, // if success, just pass it through
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - log out the user
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;