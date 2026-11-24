import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  LayoutDashboard, ClipboardList, History,
  Bell, User, LogOut, Menu, X, Wrench
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',      Icon: LayoutDashboard },
  { to: '/tasks',         label: 'My Tasks',        Icon: ClipboardList   },
  { to: '/history',       label: 'Task History',    Icon: History          },
  { to: '/notifications', label: 'Notifications',   Icon: Bell             },
  { to: '/profile',       label: 'My Profile',      Icon: User             },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifData } = useNotifications();
  const unread = notifData?.unread_count || 0;

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-blue-700">
        <Wrench className="text-white" size={24} />
        <span className="text-white font-bold text-lg">SHRAMS</span>
        <span className="text-blue-200 text-xs ml-1">Staff</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-primary-700'
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
            {label === 'Notifications' && unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-blue-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0] || 'S'}
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-none">{user?.name || 'Staff'}</p>
            <p className="text-blue-300 text-xs mt-0.5">{user?.category || 'Maintenance'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm w-full px-2 py-1.5 rounded hover:bg-blue-700 transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-primary-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-primary-900 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-bold text-primary-700">SHRAMS Staff</span>
          <NavLink to="/notifications" className="relative text-gray-600">
            <Bell size={22} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unread}
              </span>
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
