// Priority badge colors
export const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-orange-100 text-orange-800',
  medium:   'bg-yellow-100 text-yellow-800',
  low:      'bg-green-100 text-green-800',
};

// Status badge colors
export const STATUS_COLORS = {
  'Pending':      'bg-gray-100 text-gray-700',
  'Acknowledged': 'bg-blue-100 text-blue-700',
  'In Progress':  'bg-indigo-100 text-indigo-700',
  'On Hold':      'bg-orange-100 text-orange-700',
  'Resolved':     'bg-green-100 text-green-700',
};

// What transitions staff can make from each status
export const ALLOWED_TRANSITIONS = {
  'Pending':      ['Acknowledged'],
  'Acknowledged': ['In Progress'],
  'In Progress':  ['On Hold', 'Resolved'],
  'On Hold':      ['In Progress', 'Resolved'],
  'Resolved':     [],
};

export const PRIORITY_ICON = {
  critical: '🔴',
  high:     '🟠',
  medium:   '🟡',
  low:      '🟢',
};
