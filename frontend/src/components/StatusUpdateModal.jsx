import { useState } from 'react';
import { useUpdateStatus, useAddNote } from '../hooks/useTasks';
import { ALLOWED_TRANSITIONS } from '../utils/constants';
import { X, MessageSquare } from 'lucide-react';

export default function StatusUpdateModal({ task, onClose }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const { mutate: updateStatus, isPending: updating } = useUpdateStatus();
  const { mutate: addNote, isPending: addingNote } = useAddNote();

  const transitions = ALLOWED_TRANSITIONS[task.status] || [];

  const handleUpdate = () => {
    if (!selectedStatus) return;
    updateStatus(
      { id: task.id, status: selectedStatus, note: note || undefined },
      { onSuccess: onClose }
    );
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNote({ id: task.id, note }, { onSuccess: () => { setNote(''); onClose(); } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Update Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <p className="text-sm text-gray-600 mb-1">
          Current status: <span className="font-medium">{task.status}</span>
        </p>

        {transitions.length > 0 ? (
          <>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Move to status</label>
              <div className="flex flex-wrap gap-2">
                {transitions.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedStatus === s
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedStatus === 'On Hold' ? 'Reason (required)' : 'Work note (optional)'}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note about this update..."
                className="input-field resize-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUpdate}
                disabled={!selectedStatus || (selectedStatus === 'On Hold' && !note) || updating}
                className="btn-primary flex-1"
              >
                {updating ? 'Updating…' : 'Update Status'}
              </button>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-1">This task is <strong>Resolved</strong>. You can still add a work note.</p>
            <div className="mt-4">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Add a final note..."
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddNote} disabled={!note.trim() || addingNote} className="btn-primary flex-1">
                <MessageSquare size={15} className="inline mr-1" />
                {addingNote ? 'Saving…' : 'Add Note'}
              </button>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
