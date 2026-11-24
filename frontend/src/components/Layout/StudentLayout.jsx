import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon, UserIcon, DocumentPlusIcon, DocumentCheckIcon,
  BuildingOfficeIcon, WrenchScrewdriverIcon, BellIcon,
  MegaphoneIcon, QuestionMarkCircleIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellSolid } from '@heroicons/react/24/solid'

const navItems = [
  { to: '/student/dashboard',      label: 'Dashboard',         icon: HomeIcon },
  { to: '/student/profile',        label: 'My Profile',        icon: UserIcon },
  { to: '/student/application/new', label: 'Apply for Hostel', icon: DocumentPlusIcon },
  { to: '/student/application/status', label: 'Application Status', icon: DocumentCheckIcon },
  { to: '/student/allocation',     label: 'Room Allocation',   icon: BuildingOfficeIcon },
  { to: '/student/complaints',     label: 'Complaints',        icon: WrenchScrewdriverIcon },
  { to: '/student/notifications',  label: 'Notifications',     icon: BellIcon },
  { to: '/student/announcements',  label: 'Announcements',     icon: MegaphoneIcon },
  { to: '/student/services',       label: 'Services & FAQs',   icon: QuestionMarkCircleIcon },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white text-sm">S</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SHRAMS</p>
            <p className="text-white/60 text-xs">Student Portal</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {/* User info */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm w-full px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-primary-800 to-primary-900 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-gradient-to-b from-primary-800 to-primary-900">
            <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <NavLink to="/student/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
            <BellIcon className="w-5 h-5 text-gray-600" />
          </NavLink>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
