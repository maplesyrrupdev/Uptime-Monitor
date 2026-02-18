import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const publicPages = ['/login', '/setup', '/'];
      const currentPath = window.location.pathname;

      const isMonitorDetailPage = currentPath.startsWith('/monitor/');

      if (!publicPages.includes(currentPath) && !isMonitorDetailPage) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const initCsrf = async () => {
  try {
    await axios.get('/sanctum/csrf-cookie', {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Failed to initialize CSRF:', error);
  }
};

export default api;
