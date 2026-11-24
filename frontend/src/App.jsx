import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'

// Layouts
import StudentLayout from './components/Layout/StudentLayout'
import WardenLayout from './components/Layout/WardenLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import ProfilePage from './pages/student/ProfilePage'
import ApplicationPage from './pages/student/ApplicationPage'
import ApplicationStatusPage from './pages/student/ApplicationStatusPage'
import AllocationPage from './pages/student/AllocationPage'
import ComplaintsPage from './pages/student/ComplaintsPage'
import NewComplaintPage from './pages/student/NewComplaintPage'
import NotificationsPage from './pages/student/NotificationsPage'
import AnnouncementsPage from './pages/student/AnnouncementsPage'
import ServicesPage from './pages/student/ServicesPage'

// Warden Pages
import WardenDashboard from './pages/warden/WardenDashboard'
import WardenApplicationsPage from './pages/warden/ApplicationsPage'
import AllocationsPage from './pages/warden/AllocationsPage'
import StudentsPage from './pages/warden/StudentsPage'
import RoomsPage from './pages/warden/RoomsPage'
import WardenComplaintsPage from './pages/warden/WardenComplaintsPage'
import StaffPage from './pages/warden/StaffPage'
import WardenAnnouncementsPage from './pages/warden/WardenAnnouncementsPage'
import ReportsPage from './pages/warden/ReportsPage'

// Placeholder Pages
import MaintenancePlaceholder from './pages/maintenance/MaintenancePlaceholder'
import AdminPlaceholder from './pages/admin/AdminPlaceholder'
import SuperAdminPlaceholder from './pages/superadmin/SuperAdminPlaceholder'

import LoadingSpinner from './components/common/LoadingSpinner'

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage text="Loading..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their correct dashboard
    const dashboards = {
      student: '/student/dashboard',
      warden: '/warden/dashboard',
      maintenance: '/maintenance/dashboard',
      admin: '/admin/dashboard',
      super_admin: '/super-admin/dashboard',
    }
    return <Navigate to={dashboards[user?.role] || '/login'} replace />
  }
  return children
}

// Smart root redirect
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage text="Loading..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const dashboards = {
    student: '/student/dashboard',
    warden: '/warden/dashboard',
    maintenance: '/maintenance/dashboard',
    admin: '/admin/dashboard',
    super_admin: '/super-admin/dashboard',
  }
  return <Navigate to={dashboards[user?.role] || '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Student Portal */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="application/new" element={<ApplicationPage />} />
        <Route path="application/status" element={<ApplicationStatusPage />} />
        <Route path="allocation" element={<AllocationPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="complaints/new" element={<NewComplaintPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="services" element={<ServicesPage />} />
      </Route>

      {/* Warden Portal */}
      <Route path="/warden" element={
        <ProtectedRoute allowedRoles={['warden']}>
          <WardenLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/warden/dashboard" replace />} />
        <Route path="dashboard" element={<WardenDashboard />} />
        <Route path="applications" element={<WardenApplicationsPage />} />
        <Route path="allocations" element={<AllocationsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="complaints" element={<WardenComplaintsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="announcements" element={<WardenAnnouncementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Maintenance Portal (Preeti) */}
      <Route path="/maintenance/*" element={<MaintenancePlaceholder />} />

      {/* Admin Portal (Bhumika) */}
      <Route path="/admin/*" element={<AdminPlaceholder />} />

      {/* Super Admin Portal (Aneek Verma) */}
      <Route path="/super-admin/*" element={<SuperAdminPlaceholder />} />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-7xl font-bold text-gray-200">404</p>
            <p className="text-xl font-semibold text-gray-700 mt-4">Page not found</p>
            <a href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
