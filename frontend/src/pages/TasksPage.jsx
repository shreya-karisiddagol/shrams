import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { Search, Filter } from 'lucide-react';

const STATUSES   = ['', 'Pending', 'Acknowledged', 'In Progress', 'On Hold'];
const PRIORITIES = ['', 'critical', 'high', 'medium', 'low'];

export default function TasksPage() {
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1, limit: 12 });
  const { data, isLoading, isFetching } = useTasks(filters);

  const tasks = data?.data || [];
  const meta  = data?.meta;

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">My Tasks</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select
          value={filters.priority}
          onChange={e => setFilter('priority', e.target.value)}
          className="input-field w-auto text-sm"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.filter(Boolean).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Results info */}
      {meta && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {tasks.length} of {meta.total} task{meta.total !== 1 ? 's' : ''}
          {isFetching && <span className="ml-2 text-primary-500">Refreshing…</span>}
        </p>
      )}

      {/* Task grid */}
      {isLoading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks found" description="Try changing your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>

          {/* Pagination */}
          {meta && meta.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    filters.page === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
