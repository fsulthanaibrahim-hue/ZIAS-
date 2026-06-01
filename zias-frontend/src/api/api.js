import axios from "axios";
import { clearAuthStorage } from "../utils/authStorage";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

API.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  const isLoginRequest = config.url?.includes("/login/");
  const isRefreshRequest = config.url?.includes("/token/refresh/");
  if (token && !isLoginRequest && !isRefreshRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/login/") || originalRequest?.url?.includes("/token/refresh/");

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      clearAuthStorage();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/token/refresh/",
        { refresh: refreshToken }
      );

      const { access, refresh: newRefreshToken } = response.data;
      
      if (access) localStorage.setItem("access_token", access);
      if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);

      API.defaults.headers.common.Authorization = `Bearer ${access}`;
      processQueue(null, access);

      originalRequest.headers.Authorization = `Bearer ${access}`;
      return API(originalRequest);
      
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
