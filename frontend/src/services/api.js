import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shrams_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 (token expired)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('shrams_token');
      localStorage.removeItem('shrams_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Staff APIs ────────────────────────────────────────────────────────────────
export const staffApi = {
  getProfile:       () => api.get('/staff/profile'),
  updateProfile:    (data) => api.patch('/staff/profile', data),
  getWorkloadStats: () => api.get('/staff/workload-stats'),
};

// ── Task APIs ─────────────────────────────────────────────────────────────────
export const taskApi = {
  getTasks:       (params) => api.get('/staff/tasks', { params }),
  getTaskDetail:  (id) => api.get(`/staff/tasks/${id}`),
  updateStatus:   (id, payload) => api.patch(`/staff/tasks/${id}/status`, payload),
  addNote:        (id, note) => api.post(`/staff/tasks/${id}/notes`, { note }),
  getHistory:     (params) => api.get('/staff/tasks/history', { params }),
};

// ── Notification APIs ─────────────────────────────────────────────────────────
export const notifApi = {
  getAll:       () => api.get('/staff/notifications'),
  markRead:     (id) => api.patch(`/staff/notifications/${id}/read`),
  markAllRead:  () => api.patch('/staff/notifications/mark-all-read'),
};

export default api;
