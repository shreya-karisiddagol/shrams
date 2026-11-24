import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentService } from '../../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { BuildingOfficeIcon, CheckCircleIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/outline'

const STEPS = ['Choose Hostel', 'Preferences', 'Academic Info', 'Review & Submit']
const ROOM_TYPES = [
  { value: 'single', label: 'Single', desc: '1 bed per room', icon: '🛏️' },
  { value: 'double', label: 'Double', desc: '2 beds per room', icon: '🛏️🛏️' },
  { value: 'triple', label: 'Triple', desc: '3 beds per room', icon: '🛏️🛏️🛏️' },
]

export default function ApplicationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [hostels, setHostels] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    preferred_hostel_id: '', preferred_block_id: '', preferred_room_type: '',
    semester: '', academic_year: '', reason: ''
  })

  useEffect(() => {
    studentService.getHostels().then(r => setHostels(r.data?.data || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (form.preferred_hostel_id) {
      studentService.getBlocks(form.preferred_hostel_id).then(r => setBlocks(r.data?.data || []))
    }
  }, [form.preferred_hostel_id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateStep = () => {
    if (step === 0 && !form.preferred_hostel_id) return toast.error('Please select a hostel') || false
    if (step === 1 && !form.preferred_room_type) return toast.error('Please select a room type') || false
    if (step === 2 && (!form.semester || !form.academic_year)) return toast.error('Please fill semester and academic year') || false
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await studentService.applyHostel(form)
      toast.success('Application submitted successfully!')
      navigate('/student/application/status')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit application') }
    finally { setSubmitting(false) }
  }

  const selectedHostel = hostels.find(h => h.id === form.preferred_hostel_id)
  const selectedBlock = blocks.find(b => b.id === form.preferred_block_id)

  if (loading) return <LoadingSpinner text="Loading hostels..." />

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Hostel</h1>
        <p className="text-gray-500 text-sm">Fill in your preferences and submit your application</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium text-center ${i === step ? 'text-primary-600' : 'text-gray-400'}`} style={{ maxWidth: 70 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 0: Select Hostel */}
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BuildingOfficeIcon className="w-5 h-5 text-primary-600" /> Select Hostel</h2>
            {hostels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hostels available at the moment</div>
            ) : (
              <div className="grid gap-4">
                {hostels.map(h => (
                  <div
                    key={h.id}
                    onClick={() => set('preferred_hostel_id', h.id)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      form.preferred_hostel_id === h.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                          <h3 className="font-semibold text-gray-900">{h.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.type === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {h.type === 'boys' ? '👦 Boys' : '👧 Girls'}
                          </span>
                        </div>
                        {h.address && <p className="text-sm text-gray-500 mt-1">{h.address}</p>}
                        {h.facilities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {h.facilities.slice(0, 4).map(f => (
                              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {form.preferred_hostel_id === h.id && <CheckCircleIcon className="w-6 h-6 text-primary-600 flex-shrink-0" />}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4" /> Capacity: {h.total_capacity || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Preferences */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-primary-600" /> Your Preferences</h2>
            <div className="space-y-5">
              <div>
                <label className="label">Preferred Room Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROOM_TYPES.map(rt => (
                    <div
                      key={rt.value}
                      onClick={() => set('preferred_room_type', rt.value)}
                      className={`border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${
                        form.preferred_room_type === rt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{rt.icon}</div>
                      <p className="font-semibold text-sm text-gray-900">{rt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{rt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Preferred Block (Optional)</label>
                <select className="input-field" value={form.preferred_block_id} onChange={e => set('preferred_block_id', e.target.value)}>
                  <option value="">No preference</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>Block {b.block_name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Info */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Academic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Semester *</label>
                  <select className="input-field" value={form.semester} onChange={e => set('semester', e.target.value)}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <select className="input-field" value={form.academic_year} onChange={e => set('academic_year', e.target.value)}>
                    <option value="">Select</option>
                    {['2024-25','2025-26','2026-27'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Reason for Applying (Optional)</label>
                <textarea className="input-field resize-none" rows={3} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Why do you need hostel accommodation?" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Review Your Application</h2>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              {[
                ['Preferred Hostel', selectedHostel?.name || '—'],
                ['Hostel Type', selectedHostel?.type || '—'],
                ['Preferred Block', selectedBlock ? `Block ${selectedBlock.block_name}` : 'No preference'],
                ['Room Type', form.preferred_room_type || '—'],
                ['Semester', form.semester || '—'],
                ['Academic Year', form.academic_year || '—'],
                ['Reason', form.reason || 'Not provided'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-3 px-4 text-sm">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-900 font-semibold capitalize">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              📌 Your application will be reviewed by the warden. You will be notified once a decision is made.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
          {step > 0 && <button onClick={back} className="btn-secondary flex-1">← Back</button>}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary flex-1">Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : '✓ Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
