import { formatDate } from '../utils/dateUtils';

export default function StatusTimeline({ history = [] }) {
  if (!history.length) return <p className="text-sm text-gray-400">No status changes yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
      {history.map((log, i) => (
        <li key={i} className="ml-4">
          <div className="absolute w-3 h-3 bg-primary-500 rounded-full -left-1.5 border border-white" style={{ top: `${i * 56 + 4}px` }} />
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                {log.old_status || 'Created'} → {log.new_status}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{formatDate(log.changed_at)}</span>
            </div>
            {log.note && (
              <p className="text-xs text-gray-600 mt-1.5 italic">"{log.note}"</p>
            )}
            <p className="text-xs text-gray-400 mt-1">By {log.role}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
