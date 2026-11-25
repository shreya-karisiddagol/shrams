import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { staffService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
  ArrowLeftIcon, MapPinIcon, CalendarIcon, ClockIcon,
  UserIcon, PhoneIcon, TagIcon, PhotoIcon,
  CheckCircleIcon, PauseCircleIcon, PlayIcon, ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function MaintenanceTaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [singleNote, setSingleNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const loadTask = () => {
    setLoading(true)
    staffService.getTask(id)
      .then(res => {
        setTask(res.data?.data)
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load task details.')
        navigate('/maintenance/tasks')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTask()
  }, [id])

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!newStatus) return toast.error('Please select a status.')
    if (newStatus === 'on_hold' && !statusNote.trim()) {
      return toast.error('A reason/note is required when putting a task on hold.')
    }
    setSubmitting(true)
    try {
      await staffService.updateStatus(id, { status: newStatus, note: statusNote.trim() })
      toast.success(`Task status updated to ${newStatus.replace(/_/g, ' ')}!`)
      setStatusModalOpen(false)
      setStatusNote('')
      loadTask()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!singleNote.trim()) return toast.error('Note cannot be empty.')
    setSubmitting(true)
    try {
      await staffService.addNote(id, { note: singleNote.trim() })
      toast.success('Work note added successfully!')
      setNoteModalOpen(false)
      setSingleNote('')
      loadTask()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add work note.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading task details..." />
  if (!task) return null

  const isResolved = ['resolved', 'closed'].includes(task.status)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top back & actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/maintenance/tasks')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to My Tasks
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNoteModalOpen(true)}
            className="px-3.5 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
            Add Note
          </button>
          {!isResolved && (
            <button
              onClick={() => {
                setNewStatus(task.status === 'pending' ? 'in_progress' : task.status)
                setStatusModalOpen(true)
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Main Task Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={task.status} />
              <Badge status={task.priority} />
              <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-0.5 rounded-full">
                {task.category}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-xs text-gray-400">
              Task ID: <code className="bg-gray-50 px-1 py-0.5 rounded text-gray-600">{task.id}</code>
            </p>
          </div>
        </div>

        {/* Location & Student Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4 text-amber-600" /> Location Details
            </h3>
            <p className="text-gray-700 font-medium">{task.hostel_name}</p>
            <p className="text-gray-600">Block {task.block_name} · Room {task.room_number} {task.floor !== undefined && `(Floor ${task.floor})`}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-amber-600" /> Student Contact
            </h3>
            <p className="text-gray-700 font-medium">{task.student_name} {task.usn ? `(${task.usn})` : ''}</p>
            {task.student_phone ? (
              <p className="text-gray-600 flex items-center gap-1">
                <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                <a href={`tel:${task.student_phone}`} className="text-amber-700 hover:underline">
                  {task.student_phone}
                </a>
              </p>
            ) : (
              <p className="text-gray-400 text-xs italic">No phone provided</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 text-sm">Issue Description</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-100">
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Attached Photos */}
        {task.images && task.images.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <PhotoIcon className="w-4 h-4 text-gray-500" /> Attached Photos ({task.images.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {task.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  <img
                    src={img}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                    Click to enlarge
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Notes / Activity Log */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" /> Work Notes & Activity
            </h3>
          </div>
          {task.work_notes ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
              {task.work_notes}
            </div>
          ) : (
            <div className="text-gray-400 text-xs italic bg-gray-50 p-4 rounded-xl border border-gray-100">
              No work notes recorded yet. Use the "Add Note" button above to document updates or progress.
            </div>
          )}
        </div>

        {/* Student Feedback if Resolved */}
        {isResolved && (task.feedback_rating || task.feedback_comment) && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-900">Student Feedback:</span>
              {task.feedback_rating && (
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < task.feedback_rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  ))}
                </div>
              )}
            </div>
            {task.feedback_comment && (
              <p className="text-xs text-emerald-800 italic">"{task.feedback_comment}"</p>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span>Submitted: {task.created_at ? format(new Date(task.created_at), 'PPP p') : '—'}</span>
          <span>Assigned: {task.assigned_at ? format(new Date(task.assigned_at), 'PPP p') : '—'}</span>
          {task.resolved_at && (
            <span className="text-emerald-600 font-medium">
              Resolved: {format(new Date(task.resolved_at), 'PPP p')}
            </span>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Task Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Select New Status *
            </label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="input-field w-full text-sm"
              required
            >
              <option value="acknowledged">Acknowledged (Viewed and queued)</option>
              <option value="in_progress">In Progress (Currently repairing)</option>
              <option value="on_hold">On Hold (Waiting for spare parts / tools)</option>
              <option value="resolved">Resolved (Completed / Fixed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              {newStatus === 'on_hold' ? 'Reason for Hold *' : 'Work Note (Optional)'}
            </label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder={newStatus === 'on_hold' ? 'Explain why work is on hold (e.g. ordered replacement tap)...' : 'Add details about work done...'}
              className="input-field w-full text-sm resize-none"
              required={newStatus === 'on_hold'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Add Work Note"
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Note Content *
            </label>
            <textarea
              rows={4}
              value={singleNote}
              onChange={e => setSingleNote(e.target.value)}
              placeholder="e.g., Inspected valve; replacing rubber washer. Will test at 3 PM."
              className="input-field w-full text-sm resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNoteModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="rounded-2xl max-w-full max-h-[90vh] object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-800 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
