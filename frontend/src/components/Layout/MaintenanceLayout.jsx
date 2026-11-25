import { useState } from 'react'
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  HomeIcon, WrenchScrewdriverIcon, ClockIcon,
  UserIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/maintenance/dashboard', label: 'Dashboard',    icon: HomeIcon },
  { to: '/maintenance/tasks',     label: 'My Tasks',     icon: WrenchScrewdriverIcon },
  { to: '/maintenance/history',   label: 'Task History', icon: ClockIcon },
  { to: '/maintenance/profile',   label: 'My Profile',   icon: UserIcon },
]

export default function MaintenanceLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow">
            M
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SHRAMS</p>
            <p className="text-amber-200 text-xs">Maintenance Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/20 text-white font-semibold'
                  : 'text-amber-100/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <Link to="/maintenance/profile" className="flex items-center gap-3 mb-3 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 bg-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-amber-200/70 text-xs truncate">Maintenance Staff</p>
          </div>
        </Link>
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
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-amber-900 to-amber-950 flex-shrink-0">
        <Sidebar />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-gradient-to-b from-amber-900 to-amber-950">
            <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
            <Sidebar mobile />
          </aside>
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <Link to="/maintenance/profile" className="flex items-center gap-2 pl-2 border-l border-gray-100 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
              {user?.full_name?.[0]?.toUpperCase() || 'M'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.full_name}</span>
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
