import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import SearchBar from '../../components/common/SearchBar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { WrenchScrewdriverIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const CATEGORIES = ['Electrical','Plumbing','Furniture','Cleaning','AC/Fan','Internet/WiFi','Structural','Other']

export default function WardenComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' })
  const [selected, setSelected] = useState(null)
  const [staff, setStaff] = useState([])
  const [assignStaffId, setAssignStaffId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await wardenService.getComplaints({ page, limit: 10, search, ...filters })
      setComplaints(res.data?.data?.complaints || [])
      setTotal(res.data?.data?.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filters])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    wardenService.getStaff().then(r => setStaff(r.data?.data || []))
  }, [])

  const openDetail = (c) => { setSelected(c); setAssignStaffId(c.assigned_to || '') }

  const assignStaff = async () => {
    if (!assignStaffId) return toast.error('Please select a staff member')
    setSubmitting(true)
    try {
      await wardenService.assignComplaint(selected.id, { assigned_to: assignStaffId })
      toast.success('Staff assigned successfully!')
      setSelected(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }

  const priorityBorderMap = { low: 'border-l-gray-400', medium: 'border-l-blue-400', high: 'border-l-orange-400', critical: 'border-l-red-500' }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Complaints</h1>
        <p className="text-gray-500 text-sm">Review and assign maintenance complaints</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search complaints..." className="w-64" />
        <select className="input-field w-auto text-sm" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {['pending','acknowledged','in_progress','on_hold','resolved','closed','reopened'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
        <select className="input-field w-auto text-sm" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          {['low','medium','high','critical'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <select className="input-field w-auto text-sm" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? (
        <EmptyState icon={WrenchScrewdriverIcon} title="No Complaints Found" />
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div
              key={c.id}
              className={`card border-l-4 cursor-pointer hover:shadow-md transition-shadow ${priorityBorderMap[c.priority] || 'border-l-gray-300'}`}
              onClick={() => openDetail(c)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.category}</span>
                    <Badge status={c.priority} />
                    <Badge status={c.status} />
                    {c.priority === 'critical' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium animate-pulse">🚨 Critical</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{c.title}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>👤 {c.student_name}</span>
                    <span>🏠 Room {c.room_number}</span>
                    <span>📅 {format(new Date(c.created_at), 'dd MMM yyyy')}</span>
                    {c.images?.length > 0 && <span className="flex items-center gap-0.5"><PhotoIcon className="w-3 h-3" />{c.images.length}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {c.assigned_to_name ? <span className="text-blue-600 font-medium">👷 {c.assigned_to_name}</span> : <span className="text-orange-500">Unassigned</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Complaint Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge status={selected.priority} />
              <Badge status={selected.status} />
              <span className="text-sm text-gray-500">{selected.category}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selected.title}</h3>
              {selected.description && <p className="text-sm text-gray-600 mt-1">{selected.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
              <div><span className="text-gray-500">Student: </span><span className="font-medium">{selected.student_name}</span></div>
              <div><span className="text-gray-500">Room: </span><span className="font-medium">{selected.room_number}</span></div>
              <div><span className="text-gray-500">Submitted: </span><span className="font-medium">{format(new Date(selected.created_at), 'dd MMM yyyy')}</span></div>
              <div><span className="text-gray-500">USN: </span><span className="font-medium font-mono">{selected.usn}</span></div>
            </div>
            {selected.images?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Images</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.images.map((img, i) => (
                    <img key={i} src={`/api/uploads/${img}`} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display='none'} />
                  ))}
                </div>
              </div>
            )}
            {/* Assign Staff */}
            <div className="pt-3 border-t border-gray-100">
              <label className="label">Assign to Maintenance Staff</label>
              <div className="flex gap-2">
                <select className="input-field flex-1" value={assignStaffId} onChange={e => setAssignStaffId(e.target.value)}>
                  <option value="">Select staff member...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {s.category} {!s.is_available ? '(Unavailable)' : ''}
                    </option>
                  ))}
                </select>
                <button onClick={assignStaff} disabled={submitting} className="btn-success px-4 whitespace-nowrap">
                  {submitting ? '...' : 'Assign'}
                </button>
              </div>
              {selected.work_notes && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700">Staff Notes</p>
                  <p className="text-sm text-blue-800 mt-1">{selected.work_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
