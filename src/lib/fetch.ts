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
  maxRedirects: 0, // Don't follow redirects automatically to prevent HTTPS->HTTP downgrade
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
  (response) => {
    // Handle redirects manually to ensure HTTPS
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      let location = response.headers.location;
      if (location && location.startsWith('http://')) {
        // Force HTTPS for redirected location
        location = location.replace('http://', 'https://');
      }
      if (location) {
        // Make a new request to the redirect location with HTTPS
        const config = { ...response.config };
        config.url = location;
        config.baseURL = undefined; // Clear baseURL since we have a full URL
        return apiClient.request(config);
      }
    }
    return response;
  },
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
    // Remove trailing slashes to avoid redirect issues
    const cleanUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
    return apiClient.get<T>(cleanUrl, { params }).then(res => res.data);
  },

  post: <T = any>(url: string, data?: any) => {
    const cleanUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
    return apiClient.post<T>(cleanUrl, data).then(res => res.data);
  },

  put: <T = any>(url: string, data?: any) => {
    const cleanUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
    return apiClient.put<T>(cleanUrl, data).then(res => res.data);
  },

  delete: <T = any>(url: string) => {
    const cleanUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
    return apiClient.delete<T>(cleanUrl).then(res => res.data);
  },
};