import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { staffService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import {
  WrenchScrewdriverIcon, CheckIcon, PauseCircleIcon,
  PlayIcon, EyeIcon, ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'resolved', label: 'Resolved' },
]

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function MaintenanceTasksPage() {
  const [searchParams] = useSearchParams()
  const initialPriority = searchParams.get('priority') || ''

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState(initialPriority)
  const [selectedTask, setSelectedTask] = useState(null)
  const [modalAction, setModalAction] = useState({ status: '', note: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadTasks = () => {
    setLoading(true)
    staffService.getTasks({ status: statusFilter, priority: priorityFilter, limit: 50 })
      .then(res => {
        const raw = res.data?.data
        setTasks(Array.isArray(raw) ? raw : (raw?.tasks || raw?.data || []))
      })
      .catch(err => {
        console.error('Error fetching tasks:', err)
        setTasks([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTasks()
  }, [statusFilter, priorityFilter])

  const openUpdateModal = (task, newStatus = '') => {
    setSelectedTask(task)
    setModalAction({ status: newStatus || task.status, note: '' })
  }

  const submitStatusUpdate = async () => {
    if (!modalAction.status) return
    if (modalAction.status === 'on_hold' && !modalAction.note.trim()) {
      return toast.error('A note is required when putting a task on hold.')
    }
    setSubmitting(true)
    try {
      await staffService.updateStatus(selectedTask.id, modalAction)
      toast.success(`Task status updated to ${modalAction.status.replace(/_/g, ' ')}!`)
      setSelectedTask(null)
      loadTasks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Tasks</h1>
        <p className="text-gray-500 text-sm">Complaints assigned to you by the hostel warden</p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field w-auto text-sm"
        >
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="input-field w-auto text-sm"
        >
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task Grid */}
      {loading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={WrenchScrewdriverIcon}
          title="No Tasks Found"
          description={
            statusFilter || priorityFilter
              ? 'No assigned tasks match your filter.'
              : 'You have no assigned tasks right now.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className="card flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full">
                    {task.category}
                  </span>
                  <Badge status={task.priority} />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-1">{task.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 space-y-1 mb-4">
                  <p>📍 <strong>Location:</strong> Room {task.room_number} (Block {task.block_name})</p>
                  <p>👤 <strong>Student:</strong> {task.student_name} ({task.usn || '—'})</p>
                  <p>📅 <strong>Assigned:</strong> {task.assigned_at ? format(new Date(task.assigned_at), 'dd MMM yyyy') : 'Recently'}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Badge status={task.status} />
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/maintenance/tasks/${task.id}`}
                      className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg text-xs flex items-center gap-1 font-medium"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" /> Details
                    </Link>
                    <button
                      onClick={() => openUpdateModal(task)}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Update Status: ${selectedTask.title}`}
        >
          <div className="space-y-4 text-sm">
            <div>
              <label className="label">Current Status</label>
              <Badge status={selectedTask.status} />
            </div>

            <div>
              <label className="label">New Status</label>
              <select
                className="input-field"
                value={modalAction.status}
                onChange={e => setModalAction(f => ({ ...f, status: e.target.value }))}
              >
                <option value="acknowledged">Acknowledged (Inspecting)</option>
                <option value="in_progress">In Progress (Work Underway)</option>
                <option value="on_hold">On Hold (Waiting for Parts/Materials)</option>
                <option value="resolved">Resolved (Work Completed)</option>
              </select>
            </div>

            <div>
              <label className="label">
                Work Note {modalAction.status === 'on_hold' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder={
                  modalAction.status === 'on_hold'
                    ? 'State reason for hold (e.g. Waiting for spare switch)...'
                    : 'Add notes about materials replaced or work done...'
                }
                value={modalAction.note}
                onChange={e => setModalAction(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusUpdate}
                disabled={submitting}
                className="btn-primary !bg-amber-600 hover:!bg-amber-700"
              >
                {submitting ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
