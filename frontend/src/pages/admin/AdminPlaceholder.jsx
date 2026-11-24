import { CogIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export default function AdminPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CogIcon className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="font-semibold text-sm">🚧 Under Development</span>
        </div>
        <p className="text-gray-600 mb-2">
          The Administrator module is being built by
        </p>
        <p className="text-2xl font-bold text-purple-700 mb-6">Bhumika 👩‍💻</p>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 text-left mb-6 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-3">Planned Features:</p>
          {[
            'Manage warden & maintenance staff accounts',
            'Create and configure multiple hostels, blocks & rooms',
            'Monitor hostel occupancy and allocations',
            'Generate allocation & maintenance reports',
            'Configure complaint categories and system settings',
            'Export reports in CSV and PDF formats',
            'View activity logs and operational records',
          ].map(f => (
            <div key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-purple-500 mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">← Back to Login</Link>
      </div>
    </div>
  )
}
