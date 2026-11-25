import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'

const TABS = ['Occupancy', 'Allocations', 'Maintenance']
const PIE_COLORS = ['#10b981','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899']

export default function ReportsPage() {
  const [tab, setTab] = useState(0)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      wardenService.getOccupancyReport(),
      wardenService.getAllocationReport(),
      wardenService.getMaintenanceReport(),
    ]).then(([occ, alloc, maint]) => {
      setData({
        occupancy: occ.status === 'fulfilled' ? occ.value.data?.data : null,
        allocations: alloc.status === 'fulfilled' ? alloc.value.data?.data : null,
        maintenance: maint.status === 'fulfilled' ? maint.value.data?.data : null,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading reports..." />

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Hostel performance and statistics</p>
      </div>

      <div className="flex border-b border-gray-200">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'border-warden-600 text-warden-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Occupancy Report */}
      {tab === 0 && data.occupancy && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Beds', value: data.occupancy.total_beds },
              { label: 'Occupied', value: data.occupancy.occupied_beds },
              { label: 'Available', value: data.occupancy.available_beds },
              { label: 'Occupancy Rate', value: `${data.occupancy.occupancy_percent || 0}%` },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Block-wise Occupancy</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.occupancy.by_block || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="block_name" tick={{ fontSize: 11 }} tickFormatter={v => `Blk ${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="occupied_beds" name="Occupied" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="available_beds" name="Available" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">By Room Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.occupancy.by_room_type || []} dataKey="count" nameKey="room_type" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {(data.occupancy.by_room_type || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {data.occupancy.monthly_trend?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Occupancy Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.occupancy.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="occupancy_rate" name="Occupancy %" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Allocations Report */}
      {tab === 1 && data.allocations && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Active Allocations', value: data.allocations.total_active ?? data.allocations.active ?? 0 },
              { label: 'Allocated This Month', value: data.allocations.this_month ?? 0 },
              { label: 'Vacated This Month', value: data.allocations.vacated_this_month ?? 0 },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value ?? 0}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Allocation Trend</h3>
            {data.allocations.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.allocations.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="allocations" name="New Allocations" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-8">No trend data available</p>}
          </div>
        </div>
      )}

      {/* Maintenance Report */}
      {tab === 2 && data.maintenance && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Complaints', value: data.maintenance.total },
              { label: 'Open', value: data.maintenance.open },
              { label: 'Resolved', value: data.maintenance.resolved },
              { label: 'Avg Resolution (days)', value: data.maintenance.avg_resolution_days ? parseFloat(data.maintenance.avg_resolution_days).toFixed(1) : '—' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">By Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.maintenance.by_category || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">By Priority</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.maintenance.by_priority || []} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label>
                    {(data.maintenance.by_priority || []).map((_, i) => <Cell key={i} fill={['#6b7280','#6366f1','#f59e0b','#ef4444'][i % 4]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!data.occupancy && !data.allocations && !data.maintenance && (
        <div className="text-center py-12 text-gray-400">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-3" />
          <p>No report data available yet.</p>
        </div>
      )}
    </div>
  )
}
