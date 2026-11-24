import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/api'
import toast from 'react-hot-toast'
import { AcademicCapIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Reset instructions sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <AcademicCapIcon className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive reset instructions</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <EnvelopeIcon className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-700 font-medium">Email sent!</p>
            <p className="text-gray-500 text-sm">Check your inbox for password reset instructions.</p>
            <Link to="/login" className="btn-primary w-full block text-center py-2.5 mt-4">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
