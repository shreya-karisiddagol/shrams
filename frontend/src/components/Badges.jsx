import { PRIORITY_COLORS, STATUS_COLORS, PRIORITY_ICON } from '../utils/constants';

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-700'}`}>
      {PRIORITY_ICON[priority]} {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="badge bg-red-100 text-red-700 animate-pulse">⚠ Overdue</span>
  );
}
