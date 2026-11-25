import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const PRIORITY_STYLES = {
  normal:    { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-100', icon: '📢' },
  important: { badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200', icon: '⚠️' },
  urgent:    { badge: 'bg-red-100 text-red-700', border: 'border-red-200', icon: '🚨' },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy · hh:mm a')
  } catch (_) {
    return '—'
  }
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    studentService.getAnnouncements()
      .then(res => {
        const raw = res.data?.data
        const list = Array.isArray(raw)
          ? raw
          : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.announcements) ? raw.announcements : []))
        setAnnouncements(list)
      })
      .catch(err => {
        console.error('Error fetching announcements:', err)
        setAnnouncements([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? (Array.isArray(announcements) ? announcements : [])
    : (Array.isArray(announcements) ? announcements.filter(a => a.priority === filter) : [])

  if (loading) return <LoadingSpinner text="Loading announcements..." />

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 text-sm">Official notices from hostel management</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'urgent', 'important', 'normal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
              filter === f
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MegaphoneIcon} title="No Announcements" description="Check back later for hostel announcements." />
      ) : (
        <div className="grid gap-4">
          {filtered.map(a => {
            const style = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.normal
            return (
              <div key={a.id} className={`card border-l-4 ${style.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{style.icon}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${style.badge}`}>
                        {a.priority}
                      </span>
                      {a.hostel_name && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.hostel_name}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base">{a.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line leading-relaxed">{a.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>Posted by: {a.posted_by_name || 'Hostel Management'}</span>
                  <span>{formatDate(a.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
