import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { staffService } from '../../services/api'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import {
  CheckCircleIcon, ClockIcon, ArrowTopRightOnSquareIcon,
  StarIcon, MapPinIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function MaintenanceHistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const loadHistory = (p = 1) => {
    setLoading(true)
    staffService.getHistory({ page: p, limit: 20 })
      .then(res => {
        const raw = res.data?.data
        setHistory(Array.isArray(raw) ? raw : (raw?.history || raw?.data || []))
        setMeta(raw?.meta || null)
      })
      .catch(err => {
        console.error('Failed to load history:', err)
        setHistory([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory(page)
  }, [page])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Task History</h1>
        <p className="text-gray-500 text-sm">Archive of completed and resolved maintenance tasks</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading completed tasks..." />
      ) : history.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="No completed tasks yet"
          message="Once you mark assigned complaints as resolved, they will be archived here along with student ratings."
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Task</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Resolved At</th>
                    <th className="px-5 py-3.5">Student Rating</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/maintenance/tasks/${task.id}`)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">{task.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">By {task.student_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full">
                          {task.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs">
                        <p className="font-medium text-gray-800">{task.hostel_name}</p>
                        <p className="text-gray-500">Block {task.block_name} · Room {task.room_number}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={task.priority} />
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {task.resolved_at ? format(new Date(task.resolved_at), 'dd MMM yyyy, p') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {task.feedback_rating ? (
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                            <span>★ {task.feedback_rating}.0</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No rating</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-amber-600 hover:text-amber-700 text-xs font-semibold inline-flex items-center gap-1">
                          View <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-sm text-gray-600">
              <p>Showing {(page - 1) * meta.limit + 1} to {Math.min(page * meta.limit, meta.total)} of {meta.total} tasks</p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs font-medium"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg">
                  {page} / {meta.pages}
                </span>
                <button
                  disabled={page >= meta.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
