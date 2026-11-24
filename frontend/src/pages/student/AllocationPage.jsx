import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { BuildingOfficeIcon, ArrowsRightLeftIcon, ArrowRightOnRectangleIcon, TruckIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

export default function AllocationPage() {
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'room-change' | 'vacate' | 'transfer'
  const [form, setForm] = useState({})
  const [hostels, setHostels] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState({ roomChange: [], vacating: [], transfer: [] })

  useEffect(() => {
    const load = async () => {
      try {
        const [allocRes, hostelsRes] = await Promise.all([
          studentService.getAllocation(),
          studentService.getHostels(),
        ])
        setAllocation(allocRes.data?.data)
        setHostels(hostelsRes.data?.data || [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const closeModal = () => { setModal(null); setForm({}) }

  const submitRoomChange = async () => {
    if (!form.reason) return toast.error('Please provide a reason')
    setSubmitting(true)
    try {
      await studentService.roomChangeRequest({ ...form, current_allocation_id: allocation.id })
      toast.success('Room change request submitted!')
      closeModal()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const submitVacating = async () => {
    if (!form.reason || !form.expected_vacating_date) return toast.error('Please fill all required fields')
    setSubmitting(true)
    try {
      await studentService.vacatingRequest({ ...form, allocation_id: allocation.id })
      toast.success('Vacating request submitted!')
      closeModal()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const submitTransfer = async () => {
    if (!form.reason || !form.preferred_hostel_id) return toast.error('Please fill all fields')
    setSubmitting(true)
    try {
      await studentService.transferRequest({ ...form, current_allocation_id: allocation.id })
      toast.success('Transfer request submitted!')
      closeModal()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner text="Loading allocation..." />

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Allocation</h1>
        <p className="text-gray-500 text-sm">View your assigned room and manage requests</p>
      </div>

      {!allocation ? (
        <EmptyState
          icon={BuildingOfficeIcon}
          title="No Room Allocated Yet"
          description="Your room will be assigned after your hostel application is approved."
        />
      ) : (
        <>
          {/* Allocation Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-6 h-6" />
                <h2 className="font-semibold text-lg">Your Room</h2>
              </div>
              <Badge status={allocation.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['Hostel', allocation.hostel_name],
                ['Block', `Block ${allocation.block_name}`],
                ['Floor', `Floor ${allocation.floor}`],
                ['Room No.', allocation.room_number],
                ['Bed No.', allocation.bed_number],
                ['Room Type', allocation.room_type],
              ].map(([k, v]) => (
                <div key={k} className="bg-white/15 rounded-xl p-3">
                  <p className="text-white/60 text-xs font-medium">{k}</p>
                  <p className="text-white font-bold capitalize">{v || '—'}</p>
                </div>
              ))}
            </div>
            {allocation.check_in_date && (
              <p className="text-white/70 text-xs mt-4">Check-in: {format(new Date(allocation.check_in_date), 'dd MMMM yyyy')}</p>
            )}
          </div>

          {/* Amenities */}
          {allocation.amenities?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Room Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {allocation.amenities.map(a => (
                  <span key={a} className="bg-green-50 text-green-700 border border-green-200 text-sm px-3 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setModal('room-change')} className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
              <div className="p-2 bg-blue-100 rounded-lg"><ArrowsRightLeftIcon className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Request Room Change</p>
                <p className="text-xs text-gray-500">Move to a different room</p>
              </div>
            </button>
            <button onClick={() => setModal('vacate')} className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
              <div className="p-2 bg-red-100 rounded-lg"><ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Request Vacating</p>
                <p className="text-xs text-gray-500">Leave the hostel</p>
              </div>
            </button>
            <button onClick={() => setModal('transfer')} className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
              <div className="p-2 bg-purple-100 rounded-lg"><TruckIcon className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Request Transfer</p>
                <p className="text-xs text-gray-500">Move to a different hostel</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Room Change Modal */}
      <Modal isOpen={modal === 'room-change'} onClose={closeModal} title="Request Room Change">
        <div className="space-y-4">
          <div>
            <label className="label">Preferred Room Type</label>
            <select className="input-field" value={form.preferred_room_type || ''} onChange={e => set('preferred_room_type', e.target.value)}>
              <option value="">No preference</option>
              {['single','double','triple'].map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reason for Change *</label>
            <textarea className="input-field resize-none" rows={4} value={form.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Explain why you need a room change..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submitRoomChange} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Vacating Modal */}
      <Modal isOpen={modal === 'vacate'} onClose={closeModal} title="Request Vacating">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            ⚠️ Once approved, your room will be released. This action cannot be undone.
          </div>
          <div>
            <label className="label">Expected Vacating Date *</label>
            <input type="date" className="input-field" value={form.expected_vacating_date || ''} onChange={e => set('expected_vacating_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">Reason *</label>
            <textarea className="input-field resize-none" rows={4} value={form.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Why are you vacating the room?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submitVacating} disabled={submitting} className="btn-danger flex-1">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={modal === 'transfer'} onClose={closeModal} title="Request Hostel Transfer">
        <div className="space-y-4">
          <div>
            <label className="label">Preferred Hostel *</label>
            <select className="input-field" value={form.preferred_hostel_id || ''} onChange={e => set('preferred_hostel_id', e.target.value)}>
              <option value="">Select hostel</option>
              {hostels.filter(h => h.id !== allocation?.hostel_id).map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Reason *</label>
            <textarea className="input-field resize-none" rows={4} value={form.reason || ''} onChange={e => set('reason', e.target.value)} placeholder="Why do you want to transfer?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submitTransfer} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
