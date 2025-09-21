import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://workbenchapi.ethicic.com';
const API_WRITE_TOKEN = import.meta.env.VITE_API_WRITE_TOKEN || '';

// Create axios instance with base config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Cloudflare Access handles auth
  maxRedirects: 5, // Allow redirects
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status < 500, // Don't reject on 4xx errors
});

// Add bearer token for write operations
apiClient.interceptors.request.use((config) => {
  // Add bearer token for write operations (POST, PUT, DELETE)
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    config.headers.Authorization = `Bearer ${API_WRITE_TOKEN}`;
  }
  return config;
});

// Error response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Map common errors
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      if (status === 401) {
        console.error('Unauthorized - check bearer token');
      } else if (status === 403) {
        console.error('Forbidden - insufficient permissions');
      } else if (status === 404) {
        console.error('Resource not found');
      } else if (status >= 500) {
        console.error('Server error:', message);
      }
    } else if (error.request) {
      console.error('Network error - no response received:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        timeout: error.config?.timeout,
        code: error.code,
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

// Helper functions for common requests
export const fetcher = {
  get: <T = any>(url: string, params?: any) => {
    // Add trailing slash for collection endpoints that need it
    const collectionEndpoints = ['/api/portfolios', '/api/exclusions', '/api/securities'];
    const needsSlash = collectionEndpoints.some(ep => url === ep || url.startsWith(ep + '?'));
    const finalUrl = needsSlash && !url.endsWith('/') ?
      (url.includes('?') ? url.replace('?', '/?') : url + '/') : url;
    return apiClient.get<T>(finalUrl, { params }).then(res => res.data);
  },

  post: <T = any>(url: string, data?: any) => {
    const collectionEndpoints = ['/api/portfolios', '/api/exclusions'];
    const needsSlash = collectionEndpoints.some(ep => url === ep);
    const finalUrl = needsSlash && !url.endsWith('/') ? url + '/' : url;
    return apiClient.post<T>(finalUrl, data).then(res => res.data);
  },

  put: <T = any>(url: string, data?: any) => {
    return apiClient.put<T>(url, data).then(res => res.data);
  },

  delete: <T = any>(url: string) => {
    return apiClient.delete<T>(url).then(res => res.data);
  },
};