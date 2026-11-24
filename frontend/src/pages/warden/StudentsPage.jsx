import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import Modal from '../../components/common/Modal'
import SearchBar from '../../components/common/SearchBar'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { UsersIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await wardenService.getStudents({ page, limit: 12, search, department: deptFilter })
      setStudents(res.data?.data?.students || [])
      setTotal(res.data?.data?.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, deptFilter])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  const viewStudent = async (s) => {
    setSelected(s); setDetailLoading(true)
    try {
      const res = await wardenService.getStudent(s.id)
      setDetail(res.data?.data)
    } finally { setDetailLoading(false) }
  }

  const DEPTS = ['Computer Science','Information Science','Electronics','Mechanical','Civil','Electrical','Chemical','Biotechnology']

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
        <p className="text-gray-500 text-sm">{total} registered students</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name, USN or email..." className="w-72" />
        <select className="input-field w-auto text-sm" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}>
          <option value="">All Departments</option>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : students.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No Students Found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(s => (
            <div key={s.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewStudent(s)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-warden-100 rounded-full flex items-center justify-center text-warden-700 font-bold text-lg flex-shrink-0">
                  {s.full_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{s.full_name}</p>
                  <p className="text-xs text-gray-500 font-mono">{s.usn}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <p>🎓 {s.department} · Sem {s.semester}</p>
                <p>✉️ {s.email}</p>
                {s.phone && <p>📞 {s.phone}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.has_allocation ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.has_allocation ? '🏠 Allocated' : 'Not Allocated'}
                </span>
                {s.gender && <span className="text-xs text-gray-400 capitalize">{s.gender}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 12)} onPageChange={setPage} />

      {/* Student Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setDetail(null) }} title="Student Profile" size="lg">
        {detailLoading ? <LoadingSpinner size="sm" text="Loading..." /> : detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warden-100 rounded-full flex items-center justify-center text-warden-700 font-bold text-2xl">
                {detail.full_name?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{detail.full_name}</h3>
                <p className="text-gray-500 text-sm">{detail.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['USN', detail.usn], ['Department', detail.department], ['Semester', detail.semester],
                ['Gender', detail.gender], ['Blood Group', detail.blood_group], ['Phone', detail.phone],
                ['Parent Name', detail.parent_name], ['Parent Phone', detail.parent_phone],
              ].map(([k, v]) => v ? (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium">{k}</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{v}</p>
                </div>
              ) : null)}
            </div>
            {detail.allocation && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">🏠 Current Allocation</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-green-600 text-xs">Hostel</p><p className="font-medium">{detail.allocation.hostel_name}</p></div>
                  <div><p className="text-green-600 text-xs">Room</p><p className="font-medium">{detail.allocation.room_number}</p></div>
                  <div><p className="text-green-600 text-xs">Bed</p><p className="font-medium">{detail.allocation.bed_number}</p></div>
                </div>
              </div>
            )}
            {detail.address && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detail.address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
