import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService, studentService } from '../../services/api'
import toast from 'react-hot-toast'
import { AcademicCapIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline'

const DEPARTMENTS = ['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Hostel Administration', 'Other']
const SEMESTERS = [1,2,3,4,5,6,7,8]
const GENDERS = ['male', 'female', 'other']

const STUDENT_STEPS = ['Basic Info', 'Academic Details', 'Guardian Info']
const WARDEN_STEPS = ['Basic Info', 'Warden Details']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'warden' ? 'warden' : 'student'
  const [role, setRole] = useState(initialRole)
  const [step, setStep] = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hostels, setHostels] = useState([])
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '',
    // Student fields
    usn: '', department: '', semester: '', gender: '', date_of_birth: '',
    address: '', parent_name: '', parent_phone: '', parent_email: '', emergency_contact: '', blood_group: '',
    // Warden fields
    employee_id: '', hostel_id: ''
  })

  useEffect(() => {
    studentService.getHostels()
      .then(res => setHostels(res.data?.data || []))
      .catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const steps = role === 'warden' ? WARDEN_STEPS : STUDENT_STEPS

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setStep(0)
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name || !form.email || !form.password) return toast.error('Please fill in all required fields') || false
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters') || false
      if (form.password !== form.confirm_password) return toast.error('Passwords do not match') || false
    }
    if (role === 'student' && step === 1) {
      if (!form.usn || !form.department || !form.semester) return toast.error('USN, department and semester are required') || false
    }
    if (role === 'warden' && step === 1) {
      if (!form.phone) return toast.error('Phone number is required') || false
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    if (!form.phone) return toast.error('Phone number is required')
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role,
        ...(role === 'warden'
          ? {
              employee_id: form.employee_id?.trim() || undefined,
              department: form.department || undefined,
              hostel_id: form.hostel_id || undefined,
            }
          : {
              usn: form.usn?.trim(),
              department: form.department || undefined,
              semester: form.semester ? parseInt(form.semester, 10) : undefined,
              gender: form.gender || undefined,
              date_of_birth: form.date_of_birth || undefined,
              blood_group: form.blood_group || undefined,
              address: form.address || undefined,
              parent_name: form.parent_name || undefined,
              parent_phone: form.parent_phone || undefined,
              parent_email: form.parent_email || undefined,
              emergency_contact: form.emergency_contact || undefined,
            }),
      }

      await authService.register(payload)
      toast.success(`${role === 'warden' ? 'Warden' : 'Student'} account created! Please log in.`)
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const isWarden = role === 'warden'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${isWarden ? 'from-emerald-50 via-white to-teal-50' : 'from-primary-50 via-white to-indigo-50'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            {isWarden ? (
              <ShieldCheckIcon className="w-9 h-9 text-emerald-600" />
            ) : (
              <AcademicCapIcon className="w-9 h-9 text-primary-600" />
            )}
            <span className={`font-bold text-2xl ${isWarden ? 'text-emerald-700' : 'text-primary-600'}`}>SHRAMS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isWarden ? 'Create Warden Account' : 'Create Student Account'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isWarden ? 'Register as a hostel warden to manage student allocations and complaints' : 'Register to access hostel accommodation and room allocation'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isWarden
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            I am a Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('warden')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isWarden
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            I am a Warden
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                i < step
                  ? isWarden ? 'bg-emerald-600 text-white' : 'bg-primary-600 text-white'
                  : i === step
                    ? isWarden ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <CheckCircleIcon className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`mx-2 text-xs font-medium ${i === step ? (isWarden ? 'text-emerald-700' : 'text-primary-600') : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && (
                <div className={`w-10 h-0.5 ${i < step ? (isWarden ? 'bg-emerald-600' : 'bg-primary-600') : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 0: Basic Info (Both Roles) */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-2">Basic Information</h2>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input-field" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder={isWarden ? 'e.g. Dr. Ramesh Kumar' : 'Your full name'} />
                </div>
                <div>
                  <label className="label">Official Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder={isWarden ? 'warden@university.edu' : 'your@email.com'} />
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

            {/* WARDEN Step 1: Warden Professional Details */}
            {isWarden && step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-2">Warden Details</h2>
                <div>
                  <label className="label">Employee ID (Optional)</label>
                  <input className="input-field font-mono" value={form.employee_id} onChange={e => set('employee_id', e.target.value.toUpperCase())} placeholder="e.g. WRD-2024" />
                </div>
                <div>
                  <label className="label">Department / Faculty</label>
                  <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <div>
                  <label className="label">Assigned Hostel (Optional)</label>
                  <select className="input-field" value={form.hostel_id} onChange={e => set('hostel_id', e.target.value)}>
                    <option value="">Select Hostel (or leave unassigned)</option>
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.type === 'boys' ? 'Boys' : 'Girls'})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STUDENT Step 1: Academic Details */}
            {!isWarden && step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-2">Academic Details</h2>
                <div>
                  <label className="label">USN (University Seat Number) *</label>
                  <input className="input-field font-mono" value={form.usn} onChange={e => set('usn', e.target.value.toUpperCase())} placeholder="e.g. 1AB22CS001" />
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
                <div>
                  <label className="label">Blood Group</label>
                  <select className="input-field" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* STUDENT Step 2: Contact & Guardian */}
            {!isWarden && step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900 mb-2">Contact & Guardian Details</h2>
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
                <button
                  type="button"
                  onClick={next}
                  className={`flex-1 py-2.5 rounded-lg text-white font-medium transition-all ${
                    isWarden ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                    isWarden ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                    : `Create ${isWarden ? 'Warden' : 'Student'} Account`
                  }
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className={`font-medium ${isWarden ? 'text-emerald-700 hover:text-emerald-800' : 'text-primary-600 hover:text-primary-700'}`}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
