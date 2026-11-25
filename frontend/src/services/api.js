import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shrams_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('shrams_token')
      localStorage.removeItem('shrams_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
}

export const studentService = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.put('/students/profile', data),
  updateContact: (data) => api.put('/students/profile/contact', data),
  changePassword: (data) => api.put('/students/profile/password', data),

  getHostels: () => api.get('/students/hostels'),
  getBlocks: (hostelId) => api.get(`/students/hostels/${hostelId}/blocks`),

  applyHostel: (data) => api.post('/students/applications', data),
  getApplications: () => api.get('/students/applications'),
  getApplication: (id) => api.get(`/students/applications/${id}`),

  getAllocation: () => api.get('/students/allocation'),
  getAllocationHistory: () => api.get('/students/allocation/history'),
  roomChangeRequest: (data) => api.post('/students/allocation/room-change-request', data),
  vacatingRequest: (data) => api.post('/students/allocation/vacating-request', data),
  transferRequest: (data) => api.post('/students/allocation/transfer-request', data),

  getComplaints: (params) => api.get('/students/complaints', { params }),
  getComplaint: (id) => api.get(`/students/complaints/${id}`),
  createComplaint: (formData) => api.post('/students/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitFeedback: (id, data) => api.put(`/students/complaints/${id}/feedback`, data),
  reopenComplaint: (id, data) => api.put(`/students/complaints/${id}/reopen`, data),

  getNotifications: (params) => api.get('/students/notifications', { params }),
  markNotificationRead: (id) => api.put(`/students/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/students/notifications/read-all'),

  getAnnouncements: () => api.get('/students/announcements'),
  submitFeedbackGeneral: (data) => api.post('/students/feedback', data),
}

export const wardenService = {
  getDashboard: () => api.get('/wardens/dashboard'),
  getApplications: (params) => api.get('/wardens/applications', { params }),
  getApplication: (id) => api.get(`/wardens/applications/${id}`),
  reviewApplication: (id, data) => api.put(`/wardens/applications/${id}/review`, data),

  getStudents: (params) => api.get('/wardens/students', { params }),
  getStudent: (id) => api.get(`/wardens/students/${id}`),

  getRooms: (params) => api.get('/wardens/rooms', { params }),
  getOccupancy: () => api.get('/wardens/occupancy'),

  getAllocations: (params) => api.get('/wardens/allocations', { params }),
  getAllocation: (id) => api.get(`/wardens/allocations/${id}`),
  autoAllocate: () => api.post('/wardens/allocations/auto-allocate'),
  manualAllocate: (data) => api.post('/wardens/allocations', data),
  reallocate: (id, data) => api.put(`/wardens/allocations/${id}/reallocate`, data),

  getRoomChangeRequests: (params) => api.get('/wardens/room-change-requests', { params }),
  reviewRoomChange: (id, data) => api.put(`/wardens/room-change-requests/${id}/review`, data),
  getVacatingRequests: (params) => api.get('/wardens/vacating-requests', { params }),
  reviewVacating: (id, data) => api.put(`/wardens/vacating-requests/${id}/review`, data),
  getTransferRequests: (params) => api.get('/wardens/transfer-requests', { params }),
  reviewTransfer: (id, data) => api.put(`/wardens/transfer-requests/${id}/review`, data),

  getComplaints: (params) => api.get('/wardens/complaints', { params }),
  getComplaint: (id) => api.get(`/wardens/complaints/${id}`),
  assignComplaint: (id, data) => api.put(`/wardens/complaints/${id}/assign`, data),

  getStaff: () => api.get('/wardens/maintenance-staff'),

  getAnnouncements: () => api.get('/wardens/announcements'),
  createAnnouncement: (data) => api.post('/wardens/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/wardens/announcements/${id}`),

  getOccupancyReport: (params) => api.get('/wardens/reports/occupancy', { params }),
  getAllocationReport: (params) => api.get('/wardens/reports/allocations', { params }),
  getMaintenanceReport: (params) => api.get('/wardens/reports/maintenance', { params }),
}

export const staffService = {
  getProfile: () => api.get('/staff/profile'),
  updateProfile: (data) => api.put('/staff/profile', data),
  changePassword: (data) => api.put('/staff/profile/password', data),
  getWorkloadStats: () => api.get('/staff/workload-stats'),
  getTasks: (params) => api.get('/staff/tasks', { params }),
  getTask: (id) => api.get(`/staff/tasks/${id}`),
  updateStatus: (id, data) => api.patch(`/staff/tasks/${id}/status`, data),
  addNote: (id, data) => api.post(`/staff/tasks/${id}/notes`, data),
  getHistory: (params) => api.get('/staff/tasks/history', { params }),
}

export const maintenanceService = staffService

export default api

