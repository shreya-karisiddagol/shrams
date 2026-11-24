import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentService } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  DocumentTextIcon, BuildingOfficeIcon, WrenchScrewdriverIcon,
  BellIcon, PlusIcon, ArrowRightIcon, ClockIcon, CheckCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [apps, alloc, comps, notifs] = await Promise.allSettled([
          studentService.getApplications(),
          studentService.getAllocation(),
          studentService.getComplaints({ limit: 3 }),
          studentService.getNotifications({ limit: 5 }),
        ])
        setData({
          application: apps.status === 'fulfilled' ? apps.value.data?.data?.[0] : null,
          allocation: alloc.status === 'fulfilled' ? alloc.value.data?.data : null,
          complaints: comps.status === 'fulfilled' ? comps.value.data?.data?.complaints || [] : [],
          notifications: notifs.status === 'fulfilled' ? notifs.value.data?.data?.notifications || [] : [],
          unreadCount: notifs.status === 'fulfilled' ? notifs.value.data?.data?.unread_count || 0 : 0,
        })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const { application, allocation, complaints, notifications, unreadCount } = data || {}

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Hello, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-primary-200 mt-1 text-sm">Welcome to your hostel management portal</p>
        <div className="flex gap-3 mt-4">
          <Link to="/student/application/new" className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Apply for Hostel
          </Link>
          <Link to="/student/complaints/new" className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1">
            <WrenchScrewdriverIcon className="w-4 h-4" /> New Complaint
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DocumentTextIcon} label="Application" value={application?.status || 'None'} sub={application ? 'Last submitted' : 'No application yet'} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={BuildingOfficeIcon} label="Allocation" value={allocation ? 'Allocated' : 'Not Assigned'} sub={allocation ? `Room ${allocation.room_number}` : 'Apply first'} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard icon={WrenchScrewdriverIcon} label="Open Complaints" value={complaints.filter(c => !['resolved','closed'].includes(c.status)).length} sub="Active issues" iconBg="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon={BellIcon} label="Notifications" value={unreadCount} sub="Unread messages" iconBg="bg-purple-100" iconColor="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Application Status</h2>
            <Link to="/student/application/status" className="text-primary-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          {application ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge status={application.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Applied On</span>
                <span className="text-sm font-medium">{format(new Date(application.created_at), 'dd MMM yyyy')}</span>
              </div>
              {application.preferred_hostel_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preferred Hostel</span>
                  <span className="text-sm font-medium">{application.preferred_hostel_name}</span>
                </div>
              )}
              {/* Timeline */}
              <div className="mt-4 flex items-center gap-0">
                {['Applied','Under Review','Decision'].map((s, i) => {
                  const done = (application.status === 'pending' && i === 0) ||
                    (application.status !== 'pending' && i <= 1) ||
                    (['approved','rejected'].includes(application.status) && i === 2)
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${done ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs ml-1 ${done ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                      {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No application submitted yet</p>
              <Link to="/student/application/new" className="btn-primary mt-3 text-sm px-4 py-2 inline-block">Apply Now</Link>
            </div>
          )}
        </div>

        {/* Current Allocation */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Room Allocation</h2>
            <Link to="/student/allocation" className="text-primary-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          {allocation ? (
            <div className="space-y-3">
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Hostel', allocation.hostel_name],
                    ['Block', allocation.block_name],
                    ['Room', allocation.room_number],
                    ['Bed', allocation.bed_number],
                    ['Type', allocation.room_type],
                    ['Check-in', allocation.check_in_date ? format(new Date(allocation.check_in_date), 'dd MMM yyyy') : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-primary-600 font-medium">{k}</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{v || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Badge status={allocation.status} />
            </div>
          ) : (
            <div className="text-center py-6">
              <BuildingOfficeIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No room allocated yet</p>
              <p className="text-gray-400 text-xs mt-1">Apply for a hostel to get a room</p>
            </div>
          )}
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
            <Link to="/student/complaints" className="text-primary-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          {complaints.length > 0 ? (
            <div className="space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    c.status === 'pending' ? 'bg-yellow-400' :
                    c.status === 'resolved' ? 'bg-green-400' :
                    c.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.category} · {format(new Date(c.created_at), 'dd MMM')}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-10 h-10 text-green-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No complaints yet 🎉</p>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Notifications</h2>
            <Link to="/student/notifications" className="text-primary-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg ${!n.is_read ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}>
                  <div className="flex items-start gap-2">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'dd MMM · hh:mm a')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BellIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
