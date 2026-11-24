// Status badge component
const statusConfig = {
  pending:         { label: 'Pending',         cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved:        { label: 'Approved',        cls: 'bg-green-100 text-green-800 border-green-200' },
  rejected:        { label: 'Rejected',        cls: 'bg-red-100 text-red-800 border-red-200' },
  waitlisted:      { label: 'Waitlisted',      cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  active:          { label: 'Active',          cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  vacated:         { label: 'Vacated',         cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  transferred:     { label: 'Transferred',     cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  acknowledged:    { label: 'Acknowledged',    cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress:     { label: 'In Progress',     cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  on_hold:         { label: 'On Hold',         cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  resolved:        { label: 'Resolved',        cls: 'bg-green-100 text-green-800 border-green-200' },
  closed:          { label: 'Closed',          cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  reopened:        { label: 'Reopened',        cls: 'bg-red-100 text-red-800 border-red-200' },
  low:             { label: 'Low',             cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium:          { label: 'Medium',          cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  high:            { label: 'High',            cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical:        { label: 'Critical',        cls: 'bg-red-100 text-red-700 border-red-200' },
  available:       { label: 'Available',       cls: 'bg-green-100 text-green-700 border-green-200' },
  fully_occupied:  { label: 'Full',            cls: 'bg-red-100 text-red-700 border-red-200' },
  partially_occupied: { label: 'Partial',      cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  maintenance:     { label: 'Maintenance',     cls: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export default function Badge({ status, label, size = 'sm' }) {
  const cfg = statusConfig[status] || { label: label || status, cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${cfg.cls}`}>
      {label || cfg.label}
    </span>
  )
}
