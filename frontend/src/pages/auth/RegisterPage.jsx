import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/api'
import toast from 'react-hot-toast'
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const DEPARTMENTS = ['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Other']
const SEMESTERS = [1,2,3,4,5,6,7,8]
const GENDERS = ['male', 'female', 'other']

const steps = ['Basic Info', 'Academic Details', 'Guardian Info']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    usn: '', department: '', semester: '', gender: '', date_of_birth: '',
    phone: '', address: '', parent_name: '', parent_phone: '', parent_email: '', emergency_contact: '', blood_group: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name || !form.email || !form.password) return toast.error('Please fill in all required fields') || false
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters') || false
      if (form.password !== form.confirm_password) return toast.error('Passwords do not match') || false
    }
    if (step === 1) {
      if (!form.usn || !form.department || !form.semester) return toast.error('USN, department and semester are required') || false
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone) return toast.error('Phone number is required')
    setLoading(true)
    try {
      await authService.register(form)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AcademicCapIcon className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl text-primary-600">SHRAMS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Student Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to access hostel services</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <CheckCircleIcon className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`mx-2 text-xs font-medium ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input-field" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input-field pr-10" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input type="password" className="input-field" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} placeholder="Repeat password" />
                </div>
              </div>
            )}

            {/* Step 1: Academic */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-4">Academic Details</h2>
                <div>
                  <label className="label">USN (University Seat Number) *</label>
                  <input className="input-field" value={form.usn} onChange={e => set('usn', e.target.value.toUpperCase())} placeholder="e.g. 1AB22CS001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Department *</label>
                    <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Semester *</label>
                    <select className="input-field" value={form.semester} onChange={e => set('semester', e.target.value)}>
                      <option value="">Select</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input type="date" className="input-field" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Blood Group</label>
                    <select className="input-field" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Guardian */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-4">Contact & Guardian Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone Number *</label>
                    <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit number" maxLength={10} />
                  </div>
                  <div>
                    <label className="label">Emergency Contact</label>
                    <input className="input-field" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} placeholder="Emergency contact" />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea className="input-field resize-none" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Your home address" />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Parent / Guardian Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Parent Name</label>
                      <input className="input-field" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Parent full name" />
                    </div>
                    <div>
                      <label className="label">Parent Phone</label>
                      <input className="input-field" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="Parent phone" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label">Parent Email</label>
                    <input type="email" className="input-field" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="Parent email" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={back} className="btn-secondary flex-1">← Back</button>
              )}
              {step < steps.length - 1 ? (
                <button type="button" onClick={next} className="btn-primary flex-1">Next →</button>
              ) : (
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Account'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
