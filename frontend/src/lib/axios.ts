// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto refresh token on 401 (UC01)
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach((p) => {
    if (token && p.config.headers) {
      p.config.headers.Authorization = `Bearer ${token}`;
      p.resolve(token);
    } else {
      p.reject(error);
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const auth = useAuthStore.getState();
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      auth.refreshToken &&
      !isAuthPage &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }
      isRefreshing = true;
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken: auth.refreshToken,
        });
        auth.setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (!isAuthPage) {
          auth.logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && !isAuthPage) {
      auth.logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
