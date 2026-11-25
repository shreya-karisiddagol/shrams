import { useState, useEffect } from 'react'
import { staffService } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import {
  UserIcon, WrenchScrewdriverIcon, KeyIcon,
  PhoneIcon, EnvelopeIcon, CheckCircleIcon,
  IdentificationIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Cleaning & Housekeeping',
  'Painting',
  'HVAC / AC & Fans',
  'General Maintenance',
  'Civil & Masonry'
]

export default function MaintenanceProfilePage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    category: 'General Maintenance',
    is_available: true,
  })
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    staffService.getProfile()
      .then(res => {
        const p = res.data?.data
        setProfile(p)
        setForm({
          full_name: p?.full_name || '',
          email: p?.email || '',
          phone: p?.phone || '',
          category: p?.category || 'General Maintenance',
          is_available: p?.is_available !== false,
        })
      })
      .catch(err => {
        toast.error('Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await staffService.updateProfile(form)
      const updated = res.data?.data
      if (updated) {
        setProfile(updated)
      }
      updateUser({ full_name: form.full_name })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (!pwForm.current_password) return toast.error('Current password is required')
    if (pwForm.new_password.length < 6) return toast.error('New password must be at least 6 characters')
    if (pwForm.new_password !== pwForm.confirm_password) return toast.error('New passwords do not match')

    setSaving(true)
    try {
      await staffService.changePassword(pwForm)
      toast.success('Password updated successfully!')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading staff profile..." />

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: UserIcon },
    { id: 'trade', label: 'Staff & Trade Details', icon: WrenchScrewdriverIcon },
    { id: 'security', label: 'Security & Password', icon: KeyIcon },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal information and availability settings</p>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-3xl shadow-inner flex-shrink-0">
          {profile?.full_name?.[0]?.toUpperCase() || 'M'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold self-center sm:self-auto ${
              profile?.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
            }`}>
              ● {profile?.is_available ? 'Available for Tasks' : 'On Leave / Busy'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{profile?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
              🔧 {profile?.category || 'General Maintenance'}
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 font-mono px-2.5 py-1 rounded-lg">
              ID: {profile?.employee_id || 'MS-STAFF'}
            </span>
            {profile?.assigned_block && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg">
                Block {profile.assigned_block}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: Personal Information */}
          {activeTab === 'personal' && (
            <form onSubmit={saveProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Email Address (Read-only)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="input-field bg-gray-50 text-gray-500 cursor-not-allowed pl-10"
                  />
                  <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Official staff email cannot be changed directly.</p>
              </div>

              <div>
                <label className="label">Phone / Mobile Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="input-field pl-10"
                    required
                  />
                  <PhoneIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Save Personal Info'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Staff & Trade Details */}
          {activeTab === 'trade' && (
            <form onSubmit={saveProfile} className="space-y-5 max-w-xl">
              <div>
                <label className="label">Employee / Staff ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile?.employee_id || 'MS-STAFF'}
                    disabled
                    className="input-field bg-gray-50 text-gray-500 font-mono cursor-not-allowed pl-10"
                  />
                  <IdentificationIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Assigned upon registration by hostel administration.</p>
              </div>

              <div>
                <label className="label">Specialization / Trade *</label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="input-field"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Wardens filter and assign tasks matching your trade.</p>
              </div>

              <div>
                <label className="label">Assigned Location</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{profile?.hostel_name || 'Campus Hostels'}</p>
                  <p className="text-xs text-gray-500">
                    {profile?.assigned_block ? `Primary block: Block ${profile.assigned_block}` : 'Assigned to all blocks across campus'}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Work Availability Status</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_available"
                      checked={form.is_available === true}
                      onChange={() => set('is_available', true)}
                      className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-800">Available for New Tasks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <input
                      type="radio"
                      name="is_available"
                      checked={form.is_available === false}
                      onChange={() => set('is_available', false)}
                      className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-500">On Leave / Unavailable</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Save Trade Settings'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="label">Current Password *</label>
                <input
                  type="password"
                  value={pwForm.current_password}
                  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">New Password *</label>
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Confirm New Password *</label>
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))}
                  placeholder="Repeat new password"
                  className="input-field"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
