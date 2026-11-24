import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { WrenchScrewdriverIcon, PlusIcon, PhotoIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { format } from 'date-fns'

const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Cleaning', 'AC/Fan', 'Internet/WiFi', 'Structural', 'Other']

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({ status: '', category: '' })
  const [selected, setSelected] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [reopenModal, setReopenModal] = useState(null)
  const [rating, setRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await studentService.getComplaints({ page, limit: 8, ...filter })
      setComplaints(res.data?.data?.complaints || [])
      setTotal(res.data?.data?.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const submitFeedback = async () => {
    if (!rating) return toast.error('Please give a rating')
    setSubmitting(true)
    try {
      await studentService.submitFeedback(feedbackModal.id, { feedback_rating: rating, feedback_comment: feedbackComment })
      toast.success('Feedback submitted!')
      setFeedbackModal(null); setRating(0); setFeedbackComment('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const submitReopen = async () => {
    if (!reopenReason) return toast.error('Please provide a reason')
    setSubmitting(true)
    try {
      await studentService.reopenComplaint(reopenModal.id, { reason: reopenReason })
      toast.success('Complaint reopened!')
      setReopenModal(null); setReopenReason('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const priorityColors = { low: 'text-gray-500', medium: 'text-blue-600', high: 'text-orange-600', critical: 'text-red-600' }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-500 text-sm">Track your maintenance requests</p>
        </div>
        <Link to="/student/complaints/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-auto text-sm" value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1) }}>
          <option value="">All Status</option>
          {['pending','acknowledged','in_progress','on_hold','resolved','closed','reopened'].map(s => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="input-field w-auto text-sm" value={filter.category} onChange={e => { setFilter(f => ({ ...f, category: e.target.value })); setPage(1) }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? (
        <EmptyState icon={WrenchScrewdriverIcon} title="No Complaints Found" description="You haven't submitted any complaints matching the filter." />
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(selected?.id === c.id ? null : c)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.category}</span>
                    <Badge status={c.priority} />
                    <Badge status={c.status} />
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(c.created_at), 'dd MMM yyyy · hh:mm a')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.images?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><PhotoIcon className="w-4 h-4" />{c.images.length}</span>
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {selected?.id === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={e => e.stopPropagation()}>
                  {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
                  {c.room_number && <p className="text-sm text-gray-500">📍 Room {c.room_number}</p>}
                  {c.assigned_to_name && (
                    <p className="text-sm text-gray-500">👷 Assigned to: <span className="font-medium text-gray-700">{c.assigned_to_name}</span></p>
                  )}
                  {c.work_notes && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Work Notes</p>
                      <p className="text-sm text-blue-800">{c.work_notes}</p>
                    </div>
                  )}
                  {/* Images */}
                  {c.images?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {c.images.map((img, i) => (
                        <img key={i} src={`/api/uploads/${img}`} alt={`complaint-${i}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" onError={e => e.target.style.display='none'} />
                      ))}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {['resolved', 'closed'].includes(c.status) && !c.feedback_rating && (
                      <button onClick={() => setFeedbackModal(c)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <StarIcon className="w-3 h-3" /> Give Feedback
                      </button>
                    )}
                    {['resolved', 'closed'].includes(c.status) && (
                      <button onClick={() => setReopenModal(c)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                        <ArrowPathIcon className="w-3 h-3" /> Reopen
                      </button>
                    )}
                    {c.feedback_rating && (
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <StarSolid key={s} className={`w-4 h-4 ${s <= c.feedback_rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">Your rating</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 8)} onPageChange={setPage} />

      {/* Feedback Modal */}
      <Modal isOpen={!!feedbackModal} onClose={() => setFeedbackModal(null)} title="Rate Your Experience">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">How was the resolution of your complaint?</p>
          <div className="flex gap-2 justify-center">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)}>
                <StarSolid className={`w-9 h-9 transition-colors ${s <= rating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`} />
              </button>
            ))}
          </div>
          <div>
            <label className="label">Comments (Optional)</label>
            <textarea className="input-field resize-none" rows={3} value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder="Share your experience..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setFeedbackModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submitFeedback} disabled={submitting} className="btn-primary flex-1">Submit Feedback</button>
          </div>
        </div>
      </Modal>

      {/* Reopen Modal */}
      <Modal isOpen={!!reopenModal} onClose={() => setReopenModal(null)} title="Reopen Complaint">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">The issue was not resolved satisfactorily?</p>
          <div>
            <label className="label">Reason for Reopening *</label>
            <textarea className="input-field resize-none" rows={4} value={reopenReason} onChange={e => setReopenReason(e.target.value)} placeholder="Describe the issue that persists..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setReopenModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submitReopen} disabled={submitting} className="btn-danger flex-1">Reopen Complaint</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
