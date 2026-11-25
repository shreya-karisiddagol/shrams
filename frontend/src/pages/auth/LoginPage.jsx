import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'warden', label: 'Warden' },
  { value: 'maintenance', label: 'Maintenance Staff' },
  { value: 'admin', label: 'Administrator' },
  { value: 'super_admin', label: 'Super Admin' },
]

const ROLE_ROUTES = {
  student: '/student/dashboard',
  warden: '/warden/dashboard',
  maintenance: '/maintenance/dashboard',
  admin: '/admin/dashboard',
  super_admin: '/super-admin/dashboard',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'student' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.full_name}!`)
      navigate(ROLE_ROUTES[user.role] || '/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SHRAMS</h1>
              <p className="text-white/60 text-xs">Smart Hostel Room Allocation & Management System</p>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Welcome to your<br />Hostel Home 🏠</h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Manage your hostel accommodation, submit complaints, track your applications, and stay connected — all in one place.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { n: '500+', l: 'Students' },
            { n: '12', l: 'Hostel Blocks' },
            { n: '24/7', l: 'Support' },
            { n: '100%', l: 'Digital' },
          ].map(({ n, l }) => (
            <div key={l} className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">{n}</div>
              <div className="text-white/60 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <AcademicCapIcon className="w-8 h-8 text-primary-600" />
            <h1 className="font-bold text-xl text-primary-600">SHRAMS</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="label">Sign in as</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                      form.role === r.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link
              to={`/register?role=${form.role === 'maintenance' ? 'maintenance' : form.role === 'warden' ? 'warden' : 'student'}`}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              {form.role === 'warden'
                ? 'Create Warden Account'
                : form.role === 'maintenance'
                ? 'Create Maintenance Staff Account'
                : 'Create Student Account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
