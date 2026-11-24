import { ServerIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export default function SuperAdminPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ServerIcon className="w-10 h-10 text-slate-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Portal</h1>
        <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-800 px-4 py-2 rounded-full mb-4">
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
          <span className="font-semibold text-sm">🚧 Under Development</span>
        </div>
        <p className="text-gray-600 mb-2">
          The Super Administrator module is being built by
        </p>
        <p className="text-2xl font-bold text-slate-700 mb-6">Aneek Verma 👨‍💻</p>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-left mb-6 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-3">Planned Features:</p>
          {[
            'System-level access and account management',
            'Monitor frontend, backend, and API health',
            'Database management and backup/recovery',
            'OS–CN Resource Coordination Engine monitoring',
            'Race condition prevention via DB transactions',
            'Security monitoring and authentication logs',
            'Application error tracking and system reliability',
            'Schedule and restore database backups',
          ].map(f => (
            <div key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-slate-500 mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-medium">← Back to Login</Link>
      </div>
    </div>
  )
}
