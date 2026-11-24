import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import { format, isToday, isYesterday } from 'date-fns'

const TYPE_ICONS = {
  allocation: '🏠',
  complaint:  '🔧',
  announcement: '📢',
  application: '📋',
  info: '📌',
}

function groupByDate(notifications) {
  const groups = {}
  notifications.forEach(n => {
    const d = new Date(n.created_at)
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'dd MMM yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = async () => {
    try {
      const res = await studentService.getNotifications({ limit: 50 })
      setNotifications(res.data?.data?.notifications || [])
      setUnreadCount(res.data?.data?.unread_count || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await studentService.markNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
  }

  const markAllRead = async () => {
    setMarking(true)
    try {
      await studentService.markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to mark all as read') }
    finally { setMarking(false) }
  }

  if (loading) return <LoadingSpinner text="Loading notifications..." />

  const groups = groupByDate(notifications)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={marking} className="btn-secondary text-sm flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            {marking ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="No Notifications"
          description="You'll be notified about application updates, allocations, and complaints here."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{date}</p>
              <div className="space-y-2">
                {items.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      !n.is_read
                        ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!n.is_read ? 'text-primary-900' : 'text-gray-900'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'hh:mm a')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
