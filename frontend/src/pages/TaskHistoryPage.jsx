import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskHistory } from '../hooks/useTasks';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dateUtils';

export default function TaskHistoryPage() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, isLoading } = useTaskHistory({ page, limit: 20 });

  const history = data?.data || [];
  const meta    = data?.meta;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Task History</h1>
      <p className="text-gray-500 text-sm mb-6">All tasks ever assigned to you.</p>

      {isLoading ? <Spinner /> : history.length === 0 ? (
        <EmptyState icon="📂" title="No history yet" description="Completed tasks will appear here." />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  {['Task Title', 'Category', 'Block / Floor', 'Priority', 'Status', 'Assigned', 'Last Updated'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {history.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{task.title}</td>
                    <td className="px-4 py-3 text-gray-600">{task.category}</td>
                    <td className="px-4 py-3 text-gray-600">{[task.block, task.floor].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(task.assigned_at)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(task.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-gray-500">{meta.total} total tasks</p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary disabled:opacity-40 text-xs px-3 py-1"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1 text-gray-600">Page {page}</span>
                <button
                  disabled={page >= Math.ceil(meta.total / 20)}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary disabled:opacity-40 text-xs px-3 py-1"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
