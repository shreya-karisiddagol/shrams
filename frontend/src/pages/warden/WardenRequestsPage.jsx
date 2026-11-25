import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import SearchBar from '../../components/common/SearchBar'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import {
  ArrowsRightLeftIcon, ArrowRightOnRectangleIcon,
  TruckIcon, CheckIcon, XMarkIcon, EyeIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const TABS = [
  { id: 'room-change', label: 'Room Change Requests', icon: ArrowsRightLeftIcon },
  { id: 'vacating',    label: 'Vacating Requests',    icon: ArrowRightOnRectangleIcon },
  { id: 'transfer',    label: 'Transfer Requests',    icon: TruckIcon },
]

export default function WardenRequestsPage() {
  const [activeTab, setActiveTab] = useState('room-change')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: '', review_notes: '', new_bed_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let res
      const params = { page, limit: 10, status: statusFilter }
      if (activeTab === 'room-change') {
        res = await wardenService.getRoomChangeRequests(params)
      } else if (activeTab === 'vacating') {
        res = await wardenService.getVacatingRequests(params)
      } else {
        res = await wardenService.getTransferRequests(params)
      }
      const rawData = res.data?.data
      const list = Array.isArray(rawData) ? rawData : (rawData?.requests || rawData?.data || [])
      setRequests(list)
      setTotal(rawData?.total || list.length)
    } catch (err) {
      console.error('Failed to load requests:', err)
      setRequests([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadRequests()
  }, [activeTab, statusFilter])

  useEffect(() => {
    loadRequests()
  }, [page])

  // Load available rooms for room-change approval
  useEffect(() => {
    if (activeTab === 'room-change') {
      wardenService.getRooms({ status: 'available' })
        .then(res => setAvailableRooms(res.data?.data?.rooms || res.data?.data || []))
        .catch(() => {})
    }
  }, [activeTab])

  const openReviewModal = (item, action) => {
    setSelected(item)
    setReviewForm({ status: action, review_notes: '', new_bed_id: '' })
  }

  const submitReview = async () => {
    if (!reviewForm.status) return
    if (reviewForm.status === 'rejected' && !reviewForm.review_notes.trim()) {
      return toast.error('Please provide a reason for rejection')
    }
    setSubmitting(true)
    try {
      if (activeTab === 'room-change') {
        await wardenService.reviewRoomChange(selected.id, reviewForm)
      } else if (activeTab === 'vacating') {
        await wardenService.reviewVacating(selected.id, reviewForm)
      } else {
        await wardenService.reviewTransfer(selected.id, reviewForm)
      }
      toast.success(`Request ${reviewForm.status} successfully!`)
      setSelected(null)
      loadRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter(r => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      r.student_name?.toLowerCase().includes(term) ||
      r.usn?.toLowerCase().includes(term) ||
      r.reason?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Requests</h1>
          <p className="text-gray-500 text-sm">Review student room changes, vacating, and transfer requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSelected(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === id
                ? 'border-warden-600 text-warden-700 bg-warden-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student name or USN..."
          className="w-72"
        />
        <select
          className="input-field w-auto text-sm"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="ml-auto text-sm text-gray-500">{filteredRequests.length} requests</div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading requests..." />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={ArrowsRightLeftIcon}
          title="No Requests Found"
          description={
            statusFilter
              ? `No ${statusFilter} ${activeTab.replace('-', ' ')} requests match your filter.`
              : `No ${activeTab.replace('-', ' ')} requests submitted yet.`
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">USN</th>
                {activeTab === 'room-change' && (
                  <>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Current Room</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Preferred Type / Block</th>
                  </>
                )}
                {activeTab === 'vacating' && (
                  <>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Room / Bed</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Expected Vacating Date</th>
                  </>
                )}
                {activeTab === 'transfer' && (
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Preferred Hostel</th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Reason</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.student_name || 'Student'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.usn || '—'}</td>

                  {activeTab === 'room-change' && (
                    <>
                      <td className="px-4 py-3 text-gray-600">
                        {item.current_room ? `Room ${item.current_room} (${item.current_block || 'Block'})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {item.preferred_room_type || 'Any type'} {item.preferred_block_name ? `· Block ${item.preferred_block_name}` : ''}
                      </td>
                    </>
                  )}

                  {activeTab === 'vacating' && (
                    <>
                      <td className="px-4 py-3 text-gray-600">
                        {item.room_number ? `Room ${item.room_number}` : '—'} {item.bed_number ? `· Bed ${item.bed_number}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.expected_vacating_date ? format(new Date(item.expected_vacating_date), 'dd MMM yyyy') : '—'}
                      </td>
                    </>
                  )}

                  {activeTab === 'transfer' && (
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {item.preferred_hostel_name || 'Any Hostel'}
                    </td>
                  )}

                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={item.reason}>
                    {item.reason || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {item.created_at ? format(new Date(item.created_at), 'dd MMM yy') : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openReviewModal(item, 'approved')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                          title="Approve Request"
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(item, 'rejected')}
                          className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                          title="Reject Request"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelected(item); setReviewForm({ status: item.status, review_notes: item.review_notes || '' }); }}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review / Details Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`${selected.status === 'pending' ? 'Review' : 'View'} Request - ${selected.student_name}`}
        >
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-medium text-gray-900">{selected.student_name} ({selected.usn})</span>
              </div>
              {selected.reason && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Student Reason:</span>
                  <p className="bg-white p-2.5 rounded-lg border border-gray-100 text-gray-700">{selected.reason}</p>
                </div>
              )}
              {selected.status !== 'pending' && selected.review_notes && (
                <div>
                  <span className="text-gray-500 block mb-0.5">Review Notes:</span>
                  <p className="bg-white p-2.5 rounded-lg border border-gray-100 text-gray-700">{selected.review_notes}</p>
                </div>
              )}
            </div>

            {selected.status === 'pending' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Action</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="review_action"
                        value="approved"
                        checked={reviewForm.status === 'approved'}
                        onChange={() => setReviewForm(f => ({ ...f, status: 'approved' }))}
                      />
                      <span className="text-emerald-700 font-medium">Approve</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="review_action"
                        value="rejected"
                        checked={reviewForm.status === 'rejected'}
                        onChange={() => setReviewForm(f => ({ ...f, status: 'rejected' }))}
                      />
                      <span className="text-red-700 font-medium">Reject</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Review Notes {reviewForm.status === 'rejected' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder={reviewForm.status === 'rejected' ? 'Reason for rejection...' : 'Optional review notes...'}
                    value={reviewForm.review_notes}
                    onChange={e => setReviewForm(f => ({ ...f, review_notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={submitting}
                    className={`btn-primary ${reviewForm.status === 'rejected' ? '!bg-red-600 hover:!bg-red-700' : '!bg-emerald-600 hover:!bg-emerald-700'}`}
                  >
                    {submitting ? 'Submitting...' : `Confirm ${reviewForm.status === 'rejected' ? 'Rejection' : 'Approval'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
