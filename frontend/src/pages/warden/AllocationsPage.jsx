import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { Square3Stack3DIcon, BoltIcon, UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const TABS = ['Current Allocations', 'Auto Allocate', 'Manual Allocate', 'History']

export default function AllocationsPage() {
  const [tab, setTab] = useState(0)
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoResult, setAutoResult] = useState(null)
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [manualForm, setManualForm] = useState({ student_id: '', bed_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState([])
  const [pendingApproved, setPendingApproved] = useState(0)

  const loadData = () => {
    setLoading(true)
    wardenService.getAllocations({ status: 'active' })
      .then(r => setAllocations(r.data?.data?.allocations || r.data?.data || []))
      .finally(() => setLoading(false))
    wardenService.getApplications({ status: 'approved', limit: 100 })
      .then(r => setPendingApproved(r.data?.data?.total || 0))
    wardenService.getStudents({ unallocated: true, limit: 200 })
      .then(r => setStudents(r.data?.data?.students || r.data?.data || []))
    wardenService.getRooms({ status: 'available' })
      .then(r => setRooms(r.data?.data?.rooms || r.data?.data || []))
    wardenService.getAllocations({ status: 'vacated', limit: 50 })
      .then(r => setHistory(r.data?.data?.allocations || r.data?.data || []))
  }

  useEffect(() => {
    loadData()
  }, [])

  const runAutoAllocate = async () => {
    setAutoLoading(true); setAutoResult(null)
    try {
      const res = await wardenService.autoAllocate()
      setAutoResult(res.data?.data)
      toast.success(`Auto-allocation complete! ${res.data?.data?.allocated || 0} students allocated.`)
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Auto-allocation failed') }
    finally { setAutoLoading(false) }
  }

  const submitManual = async () => {
    if (!manualForm.student_id || !manualForm.bed_id) return toast.error('Please select both a student and a bed')
    setSubmitting(true)
    try {
      await wardenService.manualAllocate(manualForm)
      toast.success('Student allocated successfully!')
      setManualForm({ student_id: '', bed_id: '' })
      loadData()
    } catch (err) { toast.error(err.response?.data?.message || 'Allocation failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Allocations</h1>
        <p className="text-gray-500 text-sm">Manage student room assignments</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === i ? 'border-warden-600 text-warden-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Tab 0: Current Allocations */}
      {tab === 0 && (
        loading ? <LoadingSpinner /> : allocations.length === 0 ? (
          <EmptyState icon={Square3Stack3DIcon} title="No Active Allocations" description="No students are currently allocated." />
        ) : (
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Student', 'USN', 'Hostel', 'Block', 'Room', 'Bed', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allocations.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.student_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.usn}</td>
                    <td className="px-4 py-3 text-gray-600">{a.hostel_name}</td>
                    <td className="px-4 py-3 text-gray-600">Block {a.block_name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.room_number}</td>
                    <td className="px-4 py-3 text-gray-600">{a.bed_number}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(a.allocation_date), 'dd MMM yy')}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab 1: Auto Allocate */}
      {tab === 1 && (
        <div className="max-w-xl space-y-5">
          <div className="card border-2 border-dashed border-warden-200 bg-warden-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-warden-100 rounded-xl"><BoltIcon className="w-6 h-6 text-warden-600" /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Smart Auto-Allocation</h2>
                <p className="text-sm text-gray-500">Automatically assign rooms to approved applicants</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm text-gray-600">
              <p>✅ Matches approved applications to available beds</p>
              <p>✅ Considers preferred room type and block</p>
              <p>✅ Prevents duplicate bed assignments (race-condition safe)</p>
              <p>✅ Sends automatic notifications to students</p>
              <p className="font-semibold text-warden-700 mt-3">
                {pendingApproved} approved applications awaiting allocation
              </p>
            </div>
            <button
              onClick={runAutoAllocate}
              disabled={autoLoading || pendingApproved === 0}
              className="btn-success w-full flex items-center justify-center gap-2 py-3"
            >
              {autoLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running Auto-Allocation...</>
                : <><BoltIcon className="w-4 h-4" /> Run Auto-Allocation</>}
            </button>
          </div>
          {autoResult && (
            <div className="card bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800 mb-2">✅ Auto-Allocation Complete</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-gray-500">Allocated</p>
                  <p className="text-2xl font-bold text-green-700">{autoResult.allocated || 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-gray-500">Skipped (No beds)</p>
                  <p className="text-2xl font-bold text-orange-700">{autoResult.skipped || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Allocate */}
      {tab === 2 && (
        <div className="max-w-lg card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlusIcon className="w-5 h-5 text-warden-600" />
            <h2 className="font-semibold text-gray-900">Manual Room Allocation</h2>
          </div>
          <div>
            <label className="label">Select Student *</label>
            <select
              className="input-field"
              value={manualForm.student_id}
              onChange={e => setManualForm(f => ({ ...f, student_id: e.target.value }))}
            >
              <option value="">Search and select a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.usn || s.email}){s.application_status ? ` · App: ${s.application_status}` : ''}
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No unallocated students available.</p>
            )}
          </div>
          <div>
            <label className="label">Select Available Bed *</label>
            <select
              className="input-field"
              value={manualForm.bed_id}
              onChange={e => setManualForm(f => ({ ...f, bed_id: e.target.value }))}
            >
              <option value="">Select a bed...</option>
              {rooms.flatMap(r => {
                const beds = Array.isArray(r.available_beds) ? r.available_beds : []
                return beds.map(b => (
                  <option key={b.id} value={b.id}>
                    {r.hostel_name || 'Hostel'} › Block {r.block_name} › Room {r.room_number} › Bed {b.bed_number} ({r.room_type})
                  </option>
                ))
              })}
            </select>
            {rooms.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No available rooms or beds found.</p>
            )}
          </div>
          <button onClick={submitManual} disabled={submitting} className="btn-success w-full py-2.5 flex items-center justify-center gap-2">
            {submitting ? 'Allocating...' : '✓ Allocate Room'}
          </button>
        </div>
      )}

      {/* Tab 3: History */}
      {tab === 3 && (
        history.length === 0 ? (
          <EmptyState icon={ClockIcon} title="No Allocation History" />
        ) : (
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Student', 'USN', 'Room', 'Allocated', 'Check-out', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.student_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.usn}</td>
                    <td className="px-4 py-3 text-gray-600">{a.hostel_name} › {a.room_number}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(a.allocation_date), 'dd MMM yy')}</td>
                    <td className="px-4 py-3 text-gray-500">{a.check_out_date ? format(new Date(a.check_out_date), 'dd MMM yy') : '—'}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
