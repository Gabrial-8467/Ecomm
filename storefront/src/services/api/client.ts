import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-App': 'storefront',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    const hasStoredToken = !!localStorage.getItem('accessToken');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && hasStoredToken) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshResponse = await axios.post(
              `${API_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: { 'X-Client-App': 'storefront' },
              }
            );
            const newAccessToken = refreshResponse.data?.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              return newAccessToken;
            }
            return null;
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        if (originalRequest.headers) {
          if (typeof (originalRequest.headers as any).set === 'function') {
            (originalRequest.headers as any).set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
        }
        return api(originalRequest);
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
