import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { timeAgo } from '../utils/dateUtils';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  new_task:     '📋',
  critical_alert: '🚨',
  reassignment:  '🔄',
  update:       '✅',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const { mutate: markRead }    = useMarkRead();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const notifications = data?.data || [];

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.complaint_id) navigate(`/tasks/${n.complaint_id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={22} /> Notifications
          {data?.unread_count > 0 && (
            <span className="text-sm font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {data.unread_count} unread
            </span>
          )}
        </h1>
        {data?.unread_count > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isPending}
            className="btn-secondary text-xs flex items-center gap-1"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? <Spinner /> : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.is_read
                  ? 'bg-white border-gray-100 hover:bg-gray-50'
                  : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
