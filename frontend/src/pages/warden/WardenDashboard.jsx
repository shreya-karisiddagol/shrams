import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { wardenService } from '../../services/api'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import {
  UsersIcon, DocumentTextIcon, BuildingOfficeIcon,
  WrenchScrewdriverIcon, ArrowRightIcon, ExclamationTriangleIcon,
  ArrowsRightLeftIcon, ArrowPathIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']

export default function WardenDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = () => {
    setLoading(true)
    setError(null)
    wardenService.getDashboard()
      .then(res => {
        setData(res.data?.data || null)
      })
      .catch(err => {
        console.error('Warden dashboard fetch error:', err)
        setError(err.response?.data?.message || 'Failed to load dashboard data.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard Unavailable</h2>
        <p className="text-gray-500 text-sm">{error || 'Unable to fetch warden dashboard data.'}</p>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-emerald-200"
        >
          <ArrowPathIcon className="w-4 h-4" /> Try Again
        </button>
      </div>
    )
  }

  const occupancyData = data.occupancy_by_block?.map(b => ({
    name: `Block ${b.block_name}`,
    Occupied: parseInt(b.occupied_beds || 0, 10),
    Available: parseInt(b.available_beds || 0, 10),
  })) || []

  const roomStatusData = [
    { name: 'Available',    value: data.room_stats?.available || 0 },
    { name: 'Partial',      value: data.room_stats?.partial || 0 },
    { name: 'Full',         value: data.room_stats?.full || 0 },
    { name: 'Maintenance',  value: data.room_stats?.maintenance || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-warden-600 to-warden-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Warden Dashboard</h1>
            {data.hostel?.name && (
              <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                {data.hostel.name}
              </span>
            )}
          </div>
          <p className="text-warden-100 text-sm">Manage hostel operations, student applications and room requests</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-all"
          title="Refresh Dashboard"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={UsersIcon} label="Total Students" value={data.stats?.total_students ?? 0} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={DocumentTextIcon} label="Pending Applications" value={data.stats?.pending_applications ?? 0} iconBg="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard icon={ArrowsRightLeftIcon} label="Student Requests" value={data.stats?.pending_requests ?? 0} iconBg="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={BuildingOfficeIcon} label="Available Beds" value={data.stats?.available_beds ?? 0} iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard icon={WrenchScrewdriverIcon} label="Open Complaints" value={data.stats?.open_complaints ?? 0} iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/warden/applications" className="card hover:shadow-md transition-all flex items-center justify-between p-4 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-all">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Hostel Applications</p>
              <p className="text-xs text-gray-500">{data.stats?.pending_applications || 0} pending review</p>
            </div>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-warden-600 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/warden/requests" className="card hover:shadow-md transition-all flex items-center justify-between p-4 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-all">
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Student Requests</p>
              <p className="text-xs text-gray-500">{data.stats?.pending_requests || 0} change / vacating / transfer</p>
            </div>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-warden-600 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/warden/allocations" className="card hover:shadow-md transition-all flex items-center justify-between p-4 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-all">
              <BuildingOfficeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Room Allocation</p>
              <p className="text-xs text-gray-500">{data.stats?.available_beds || 0} beds available</p>
            </div>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-warden-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Block-wise Occupancy</h2>
          {occupancyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Occupied" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Available" fill="#d1fae5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No occupancy data yet</p>}
        </div>

        {/* Room Status Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Room Status</h2>
          {roomStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roomStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {roomStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No data yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/warden/applications" className="text-warden-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {(data.recent_applications || []).slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.student_name}</p>
                  <p className="text-xs text-gray-500">{app.usn} · {app.preferred_room_type || '—'}</p>
                </div>
                <Badge status={app.status} />
              </div>
            ))}
            {(!data.recent_applications?.length) && <p className="text-gray-400 text-sm text-center py-4">No recent applications</p>}
          </div>
        </div>

        {/* Critical Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" /> Urgent Complaints
            </h2>
            <Link to="/warden/complaints" className="text-warden-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">View All <ArrowRightIcon className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {(data.urgent_complaints || []).slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.category} · Room {c.room_number}</p>
                </div>
                <Badge status={c.priority} />
              </div>
            ))}
            {(!data.urgent_complaints?.length) && (
              <div className="text-center py-4">
                <p className="text-green-600 text-sm font-medium">✓ No urgent complaints</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
