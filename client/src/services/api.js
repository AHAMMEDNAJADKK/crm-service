import axios from 'axios';

// Normalize base URL: strip trailing slashes and redundant /api or /api/v1 prefixes
let rawBaseURL = (import.meta.env.VITE_API_URL || '').trim();
rawBaseURL = rawBaseURL.replace(/\/+$/, '').replace(/\/api\/v1$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: rawBaseURL, // Resolves relative paths or remote backend origin cleanly
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Ensure HTTP-only cookies are sent/received
});

// Request interceptor to attach Bearer token for cross-origin resilience
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_auth_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if unauthorized and request is not login or refresh itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to call refresh endpoint
        const refreshToken = localStorage.getItem('crm_refresh_token');
        const refreshRes = await axios.post(`${rawBaseURL}/api/v1/auth/refresh`, { refreshToken }, { withCredentials: true });
        if (refreshRes.data?.data?.token) {
          localStorage.setItem('crm_auth_token', refreshRes.data.data.token);
        }
        
        isRefreshing = false;
        processQueue(null);
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Clear local storage and redirect if refresh fails
        localStorage.removeItem('crm_auth_token');
        localStorage.removeItem('crm_refresh_token');
        console.error('Session expired. Redirecting to login.');
        
        // Redirect to admin login if inside admin area
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
