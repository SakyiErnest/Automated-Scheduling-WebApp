import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_SCHEDULER_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions for scheduler
export const schedulerApi = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Generate a schedule
  generateSchedule: (data: Record<string, unknown>) => api.post('/generate-schedule', data),

  // Validate constraints
  validateConstraints: (data: Record<string, unknown>) => api.post('/validate-constraints', data),

  // Export schedule as PDF
  exportPdf: (data: { schedule: Record<string, unknown>, classId?: string, includeBreaks?: boolean }) => {
    return api.post('/export/pdf', data, {
      responseType: 'blob',
    });
  },

  // Export schedule as Excel
  exportExcel: (data: { schedule: Record<string, unknown>, classId?: string, includeBreaks?: boolean }) => {
    return api.post('/export/excel', data, {
      responseType: 'blob',
    });
  },
};

export default api;
