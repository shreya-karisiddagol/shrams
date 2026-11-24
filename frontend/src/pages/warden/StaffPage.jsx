import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    wardenService.getStaff()
      .then(r => setStaff(r.data?.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading staff..." />

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Staff</h1>
        <p className="text-gray-500 text-sm">{staff.length} staff members</p>
      </div>

      {staff.length === 0 ? (
        <EmptyState icon={UserGroupIcon} title="No Staff Found" description="No maintenance staff has been added yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => {
            const workload = s.active_tasks || 0
            const maxLoad = 10
            const pct = Math.min(100, Math.round((workload / maxLoad) * 100))
            return (
              <div key={s.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-warden-100 rounded-full flex items-center justify-center text-warden-700 font-bold text-xl flex-shrink-0">
                    {s.full_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.full_name}</p>
                    <p className="text-xs text-gray-500">{s.employee_id || 'Staff'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${s.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.is_available ? '● Available' : '● Busy'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{s.category || 'General'}</span>
                  </div>
                  {s.assigned_block_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Assigned Block</span>
                      <span className="font-medium">Block {s.assigned_block_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Active Tasks</span>
                    <span className="font-medium">{workload}</span>
                  </div>
                </div>
                {/* Workload bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Workload</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-400' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  ✉️ {s.email}
                  {s.phone && <><br />📞 {s.phone}</>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
