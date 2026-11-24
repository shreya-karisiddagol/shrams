import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { CameraIcon, KeyIcon, UserIcon, AcademicCapIcon, PhoneIcon } from '@heroicons/react/24/outline'

const DEPARTMENTS = ['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics', 'Other']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [form, setForm] = useState({})
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  useEffect(() => {
    studentService.getProfile().then(res => {
      const p = res.data?.data
      setProfile(p)
      setForm({
        full_name: p?.full_name || '', email: p?.email || '', phone: p?.phone || '',
        date_of_birth: p?.date_of_birth?.split('T')[0] || '', gender: p?.gender || '',
        blood_group: p?.blood_group || '', address: p?.address || '',
        usn: p?.usn || '', department: p?.department || '', semester: p?.semester || '',
        parent_name: p?.parent_name || '', parent_phone: p?.parent_phone || '',
        parent_email: p?.parent_email || '', emergency_contact: p?.emergency_contact || '',
      })
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await studentService.updateProfile(form)
      updateUser({ full_name: form.full_name, email: form.email })
      toast.success('Profile updated successfully')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm_password) return toast.error('Passwords do not match')
    if (pwForm.new_password.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      await studentService.changePassword(pwForm)
      toast.success('Password changed successfully')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner text="Loading profile..." />

  const tabs = [
    { id: 'personal', label: 'Personal', icon: UserIcon },
    { id: 'academic', label: 'Academic', icon: AcademicCapIcon },
    { id: 'contact', label: 'Contact & Guardian', icon: PhoneIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm">Manage your personal information</p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors">
            <CameraIcon className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{profile?.full_name}</h2>
          <p className="text-gray-500 text-sm">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{profile?.usn}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{profile?.department}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={activeTab === 'security' ? changePassword : saveProfile} className="p-6">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name *</label>
                <input className="input-field" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input-field" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select className="input-field" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea className="input-field resize-none" rows={3} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Your home address" />
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">USN</label>
                <input className="input-field bg-gray-50" value={form.usn} readOnly title="USN cannot be changed" />
                <p className="text-xs text-gray-400 mt-1">USN cannot be changed. Contact admin if incorrect.</p>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select className="input-field" value={form.semester} onChange={e => set('semester', e.target.value)}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Phone Number</label>
                <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit number" />
              </div>
              <div>
                <label className="label">Emergency Contact</label>
                <input className="input-field" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} />
              </div>
              <div className="md:col-span-2 pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-4">Parent / Guardian Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Parent Name</label>
                    <input className="input-field" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Parent Phone</label>
                    <input className="input-field" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Parent Email</label>
                    <input type="email" className="input-field" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-md space-y-5">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Choose a strong password with at least 6 characters.
              </div>
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input-field" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input-field" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input-field" value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button type="submit" disabled={saving} className="btn-primary px-8 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
