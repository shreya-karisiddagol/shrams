import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const timeline = [
  { label: 'Applied', key: 'applied' },
  { label: 'Under Review', key: 'review' },
  { label: 'Decision', key: 'decision' },
]

function getTimelineStep(status) {
  if (status === 'pending') return 1
  if (status === 'waitlisted') return 2
  if (status === 'approved' || status === 'rejected') return 3
  return 0
}

export default function ApplicationStatusPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    studentService.getApplications().then(res => {
      const apps = res.data?.data || []
      setApplications(apps)
      if (apps.length) setSelected(apps[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading applications..." />

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Status</h1>
        <p className="text-gray-500 text-sm">Track your hostel application</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No Applications Found"
          description="You haven't applied for a hostel yet."
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Application list */}
          <div className="space-y-3">
            {applications.map(app => (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                className={`card cursor-pointer transition-all hover:shadow-md ${selected?.id === app.id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{format(new Date(app.created_at), 'dd MMM yyyy')}</span>
                  <Badge status={app.status} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{app.preferred_hostel_name || 'Any Hostel'}</p>
                <p className="text-xs text-gray-500 capitalize">{app.preferred_room_type || '—'} room · Sem {app.semester}</p>
              </div>
            ))}
          </div>

          {/* Application detail */}
          {selected && (
            <div className="lg:col-span-2 card space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Application Details</h2>
                <Badge status={selected.status} size="md" />
              </div>

              {/* Timeline */}
              <div className="flex items-center">
                {timeline.map((t, i) => {
                  const done = i < getTimelineStep(selected.status)
                  const current = i === getTimelineStep(selected.status) - 1
                  return (
                    <div key={t.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          done ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs mt-1 font-medium text-center ${done ? 'text-primary-600' : 'text-gray-400'}`} style={{ maxWidth: 70 }}>
                          {t.label}
                        </span>
                      </div>
                      {i < timeline.length - 1 && <div className={`flex-1 h-1 mx-2 mb-5 rounded-full ${done ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                    </div>
                  )
                })}
              </div>

              {/* Info grid */}
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {[
                  ['Application Date', format(new Date(selected.created_at), 'dd MMM yyyy')],
                  ['Preferred Hostel', selected.preferred_hostel_name || 'Any'],
                  ['Preferred Room Type', selected.preferred_room_type || '—'],
                  ['Semester', selected.semester],
                  ['Academic Year', selected.academic_year || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3 px-4 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900 capitalize">{v || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Status-specific messages */}
              {selected.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 font-semibold mb-1">🎉 Application Approved!</p>
                  <p className="text-green-700 text-sm">Your hostel application has been approved. Check the Room Allocation page for your assigned room details.</p>
                </div>
              )}
              {selected.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-semibold mb-1">Application Rejected</p>
                  <p className="text-red-700 text-sm">{selected.review_notes || 'Your application was not approved. Contact the warden for more details.'}</p>
                </div>
              )}
              {selected.status === 'waitlisted' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-purple-800 font-semibold mb-1">⏳ You are Waitlisted</p>
                  <p className="text-purple-700 text-sm">You are on the waitlist. We'll notify you when a slot becomes available.</p>
                </div>
              )}
              {selected.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 font-semibold mb-1">🕐 Application Under Review</p>
                  <p className="text-yellow-700 text-sm">Your application is being reviewed by the warden. This usually takes 2–3 working days.</p>
                </div>
              )}

              {selected.review_notes && selected.status !== 'rejected' && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Warden Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.review_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
