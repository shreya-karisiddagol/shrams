import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import toast from 'react-hot-toast'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { MegaphoneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const PRIORITIES = ['normal','important','urgent']
const PRIORITY_STYLES = {
  normal:    'bg-blue-50 border-blue-200 text-blue-800',
  important: 'bg-orange-50 border-orange-200 text-orange-800',
  urgent:    'bg-red-50 border-red-200 text-red-800',
}
const PRIORITY_ICONS = { normal: '📢', important: '⚠️', urgent: '🚨' }

export default function WardenAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', expires_at: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    wardenService.getAnnouncements()
      .then(r => {
        const raw = r.data?.data
        const list = Array.isArray(raw) ? raw : (raw?.announcements || raw?.data || [])
        setAnnouncements(list)
      })
      .catch(err => {
        console.error('Failed to load announcements:', err)
        setAnnouncements([])
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content are required')
    setSubmitting(true)
    try {
      await wardenService.createAnnouncement(form)
      toast.success('Announcement published!')
      setForm({ title: '', content: '', priority: 'normal', expires_at: '' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to publish') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await wardenService.deleteAnnouncement(id)
      toast.success('Announcement deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 text-sm">Publish notices and announcements to students</p>
      </div>

      {/* Create Form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MegaphoneIcon className="w-5 h-5 text-warden-600" /> New Announcement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea className="input-field resize-none" rows={4} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write the announcement content..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('priority', p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 capitalize transition-all ${
                      form.priority === p ? PRIORITY_STYLES[p] : 'border-gray-200 text-gray-500'
                    }`}
                  >{PRIORITY_ICONS[p]} {p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Expires On (Optional)</label>
              <input type="datetime-local" className="input-field" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-success flex items-center gap-2">
            {submitting ? 'Publishing...' : '📢 Publish Announcement'}
          </button>
        </form>
      </div>

      {/* Announcement List */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Published Announcements</h2>
        {loading ? <LoadingSpinner /> : announcements.length === 0 ? (
          <EmptyState icon={MegaphoneIcon} title="No Announcements Yet" description="Publish your first announcement above." />
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className={`card border ${PRIORITY_STYLES[a.priority]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{PRIORITY_ICONS[a.priority]}</span>
                      <span className="text-xs font-semibold capitalize">{a.priority}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm mt-1 opacity-80 whitespace-pre-line">{a.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {format(new Date(a.created_at), 'dd MMM yyyy · hh:mm a')}
                      {a.expires_at && ` · Expires: ${format(new Date(a.expires_at), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0" title="Delete">
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
