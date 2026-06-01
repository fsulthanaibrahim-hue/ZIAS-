import axios from 'axios';
import { clearAuthStorage } from './authStorage';

// Configure axios defaults
axios.defaults.baseURL = 'http://127.0.0.1:8000/api/';

// Add request interceptor to attach token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const isLoginRequest = config.url?.includes('/login/');
    const isRefreshRequest = config.url?.includes('/token/refresh/');
    if (token && !isLoginRequest && !isRefreshRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    const isAuthRequest = originalRequest?.url?.includes('/login/') || originalRequest?.url?.includes('/token/refresh/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken
        });
        
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
