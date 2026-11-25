import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { staffService } from '../../services/api'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import {
  WrenchScrewdriverIcon, ClockIcon, CheckCircleIcon,
  PauseCircleIcon, ExclamationTriangleIcon, ArrowRightIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function MaintenanceDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      staffService.getProfile(),
      staffService.getWorkloadStats(),
      staffService.getTasks({ limit: 5 }),
    ]).then(([p, s, t]) => {
      if (p.status === 'fulfilled') setProfile(p.value.data?.data)
      if (s.status === 'fulfilled') setStats(s.value.data?.data)
      if (t.status === 'fulfilled') {
        const raw = t.value.data?.data
        setTasks(Array.isArray(raw) ? raw : (raw?.tasks || raw?.data || []))
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Staff'} 👋
          </h1>
          <p className="text-amber-100 text-sm mt-1">
            {profile?.category || 'General Maintenance'} · {profile?.assigned_block ? `Block ${profile.assigned_block}` : (profile?.hostel_name || 'All Hostels')}
          </p>
        </div>
        <Link
          to="/maintenance/tasks"
          className="self-start sm:self-auto px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <WrenchScrewdriverIcon className="w-4 h-4" /> View My Tasks
        </Link>
      </div>

      {/* Critical Alert */}
      {stats?.critical_pending > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-red-900 text-sm">
                {stats.critical_pending} Critical Complaint{stats.critical_pending > 1 ? 's' : ''} Awaiting Attention
              </p>
              <p className="text-red-600 text-xs mt-0.5">Please inspect and resolve these urgently.</p>
            </div>
          </div>
          <Link
            to="/maintenance/tasks?priority=critical"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClockIcon} label="Pending Tasks" value={stats?.total_pending ?? 0} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={WrenchScrewdriverIcon} label="In Progress" value={stats?.in_progress ?? 0} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard icon={PauseCircleIcon} label="On Hold" value={stats?.on_hold ?? 0} iconBg="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={CheckCircleIcon} label="Resolved" value={stats?.total_resolved ?? 0} iconBg="bg-green-100" iconColor="text-green-600" />
      </div>

      {/* Recent Assigned Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">Recently Assigned Tasks</h2>
            <p className="text-gray-500 text-xs">Complaints assigned to you by the hostel warden</p>
          </div>
          <Link
            to="/maintenance/tasks"
            className="text-amber-700 hover:text-amber-800 text-sm font-medium flex items-center gap-1"
          >
            All Tasks <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="No Assigned Tasks"
            description="You have no pending maintenance complaints assigned to you right now."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/maintenance/tasks/${t.id}`)}
                className="py-3.5 flex items-start justify-between gap-4 hover:bg-gray-50/80 px-2 rounded-xl cursor-pointer transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full">
                      {t.category}
                    </span>
                    <Badge status={t.priority} />
                    <span className="text-xs text-gray-400 font-mono">
                      Room {t.room_number} · Block {t.block_name}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{t.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge status={t.status} />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t.created_at ? format(new Date(t.created_at), 'dd MMM') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
