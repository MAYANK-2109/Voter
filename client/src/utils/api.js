import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Quality: Errors are returned to callers for specific UI handling.
    // Intrusive console.error removed.
    return Promise.reject(error);
  }
);

export default api;
