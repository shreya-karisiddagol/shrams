import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge, OverdueBadge } from './Badges';
import { timeAgo, isOverdue } from '../utils/dateUtils';
import { MapPin, Clock, Tag } from 'lucide-react';

export default function TaskCard({ task }) {
  const navigate = useNavigate();
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="card hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <StatusBadge status={task.status} />
        {overdue && <OverdueBadge />}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Tag size={12} />
          <span>{task.category}</span>
        </div>
        {(task.block || task.floor) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} />
            <span>{[task.block, task.floor].filter(Boolean).join(', Floor ')}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          <span>Assigned {timeAgo(task.assigned_at)}</span>
        </div>
        {task.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            <Clock size={12} />
            <span>Due {timeAgo(task.deadline)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
