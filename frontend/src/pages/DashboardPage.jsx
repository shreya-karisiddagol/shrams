import { useNavigate } from 'react-router-dom';
import { useWorkloadStats, useProfile } from '../hooks/useProfile';
import { useTasks } from '../hooks/useTasks';
import StatCard from '../components/StatCard';
import TaskCard from '../components/TaskCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: statsData, isLoading: statsLoading } = useWorkloadStats();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 4 });

  const profile = profileData?.data;
  const stats   = statsData?.data;
  const tasks   = tasksData?.data || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {profileLoading ? 'Loading…' : `Welcome, ${profile?.full_name?.split(' ')[0] || 'Staff'} 👋`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {profile?.category} · {profile?.assigned_block || 'All Blocks'}
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <div className="col-span-4"><Spinner /></div>
        ) : (
          <>
            <StatCard icon="📋" label="Total Pending"  value={stats?.total_pending}   color="blue"   />
            <StatCard icon="⚙️" label="In Progress"    value={stats?.in_progress}      color="purple" />
            <StatCard icon="⏸"  label="On Hold"        value={stats?.on_hold}          color="yellow" />
            <StatCard icon="✅" label="Resolved"       value={stats?.total_resolved}   color="green"  />
          </>
        )}
      </section>

      {/* Critical alert */}
      {stats?.critical_pending > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-semibold text-red-800">
              {stats.critical_pending} Critical Complaint{stats.critical_pending > 1 ? 's' : ''} Pending
            </p>
            <p className="text-red-600 text-sm">Please attend to these immediately.</p>
          </div>
          <button
            onClick={() => navigate('/tasks?priority=critical')}
            className="ml-auto text-sm font-medium text-red-700 hover:text-red-900 flex items-center gap-1"
          >
            View <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Recent Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {tasksLoading ? (
          <Spinner />
        ) : tasks.length === 0 ? (
          <EmptyState icon="🎉" title="No tasks assigned" description="You have no pending tasks right now." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </section>
    </div>
  );
}
