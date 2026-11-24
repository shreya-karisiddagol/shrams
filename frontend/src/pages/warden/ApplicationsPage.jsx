import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import SearchBar from '../../components/common/SearchBar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { DocumentTextIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function WardenApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: '', review_notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await wardenService.getApplications({ page, limit: 10, search, status: statusFilter })
      setApplications(res.data?.data?.applications || [])
      setTotal(res.data?.data?.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  const openReview = (app, action) => {
    setSelected(app)
    setReviewForm({ status: action, review_notes: '' })
  }

  const submitReview = async () => {
    if (!reviewForm.status) return
    if (reviewForm.status === 'rejected' && !reviewForm.review_notes) return toast.error('Please provide a reason for rejection')
    setSubmitting(true)
    try {
      await wardenService.reviewApplication(selected.id, reviewForm)
      toast.success(`Application ${reviewForm.status}!`)
      setSelected(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hostel Applications</h1>
        <p className="text-gray-500 text-sm">Review and process student applications</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or USN..." className="w-64" />
        <select className="input-field w-auto text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          {['pending','approved','rejected','waitlisted'].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500">{total} applications</div>
      </div>

      {loading ? <LoadingSpinner /> : applications.length === 0 ? (
        <EmptyState icon={DocumentTextIcon} title="No Applications Found" description="No applications match your filter." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student', 'USN', 'Dept', 'Preferred Hostel', 'Room Type', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{app.student_name}</p>
                    <p className="text-xs text-gray-400">{app.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{app.usn}</td>
                  <td className="px-4 py-3 text-gray-600">{app.department}</td>
                  <td className="px-4 py-3 text-gray-600">{app.preferred_hostel_name || '—'}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{app.preferred_room_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(app.created_at), 'dd MMM yy')}</td>
                  <td className="px-4 py-3"><Badge status={app.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(app); setReviewForm({ status: '', review_notes: '' }) }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg" title="View Details">
                        <EyeIcon className="w-4 h-4 text-blue-600" />
                      </button>
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => openReview(app, 'approved')} className="p-1.5 hover:bg-green-100 rounded-lg" title="Approve">
                            <CheckIcon className="w-4 h-4 text-green-600" />
                          </button>
                          <button onClick={() => openReview(app, 'rejected')} className="p-1.5 hover:bg-red-100 rounded-lg" title="Reject">
                            <XMarkIcon className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />

      {/* Detail / Review Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Application Details" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Student info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-warden-100 rounded-full flex items-center justify-center text-warden-700 font-bold text-lg">
                {selected.student_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.student_name}</p>
                <p className="text-sm text-gray-500">{selected.student_email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selected.usn}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selected.department} · Sem {selected.semester}</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              {[
                ['Preferred Hostel', selected.preferred_hostel_name || 'Any'],
                ['Preferred Room Type', selected.preferred_room_type || 'Any'],
                ['Academic Year', selected.academic_year || '—'],
                ['Reason', selected.reason || 'Not provided'],
                ['Applied On', format(new Date(selected.created_at), 'dd MMM yyyy')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 px-4 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-900 capitalize max-w-xs text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Current status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current Status:</span>
              <Badge status={selected.status} size="md" />
            </div>

            {/* Review Action */}
            {selected.status === 'pending' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Review Decision</p>
                <div className="grid grid-cols-3 gap-2">
                  {['approved','rejected','waitlisted'].map(s => (
                    <button
                      key={s}
                      onClick={() => setReviewForm(f => ({ ...f, status: s }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border-2 capitalize transition-all ${
                        reviewForm.status === s
                          ? s === 'approved' ? 'border-green-500 bg-green-50 text-green-700'
                            : s === 'rejected' ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Notes {reviewForm.status === 'rejected' ? '*' : '(Optional)'}</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    value={reviewForm.review_notes}
                    onChange={e => setReviewForm(f => ({ ...f, review_notes: e.target.value }))}
                    placeholder="Add notes for the student..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={submitReview} disabled={submitting || !reviewForm.status} className={`flex-1 btn-primary ${!reviewForm.status ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {submitting ? 'Saving...' : 'Confirm Decision'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
