import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskDetail } from '../hooks/useTasks';
import { PriorityBadge, StatusBadge, OverdueBadge } from '../components/Badges';
import StatusUpdateModal from '../components/StatusUpdateModal';
import StatusTimeline from '../components/StatusTimeline';
import Spinner from '../components/Spinner';
import { formatDate, isOverdue } from '../utils/dateUtils';
import { ArrowLeft, MapPin, Calendar, Clock, User, Tag, Image } from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTaskDetail(id);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  if (isLoading) return <Spinner />;
  if (!data?.data) return <p className="text-gray-500 text-center py-16">Task not found.</p>;

  const task = data.data;
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Title row */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {overdue && <OverdueBadge />}
            </div>
          </div>
          {task.status !== 'Resolved' && (
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
              Update Status
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 mt-5 text-sm text-gray-600">
          <div className="flex items-center gap-2"><Tag size={14} /><span>{task.category}</span></div>
          {(task.block || task.floor) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{[task.block, task.floor && `Floor ${task.floor}`].filter(Boolean).join(', ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2"><Calendar size={14} /><span>Submitted: {formatDate(task.submitted_at)}</span></div>
          <div className="flex items-center gap-2"><Calendar size={14} /><span>Assigned: {formatDate(task.assigned_at)}</span></div>
          {task.deadline && (
            <div className={`flex items-center gap-2 ${overdue ? 'text-red-500 font-medium' : ''}`}>
              <Clock size={14} />
              <span>Deadline: {formatDate(task.deadline)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-2">Description</h2>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{task.description}</p>
      </div>

      {/* Images */}
      {task.images && task.images.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Image size={16} /> Complaint Images
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {task.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Issue image ${i + 1}`}
                onClick={() => setLightbox(url)}
                className="rounded-lg object-cover aspect-square cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Status History</h2>
        <StatusTimeline history={task.status_history} />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-[90vh] rounded-lg" />
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && <StatusUpdateModal task={task} onClose={() => setShowModal(false)} />}
    </div>
  );
}
