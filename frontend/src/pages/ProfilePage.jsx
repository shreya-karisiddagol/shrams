import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile, useWorkloadStats } from '../hooks/useProfile';
import { staffApi } from '../services/api';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { User, Phone, Briefcase, Building, Shield } from 'lucide-react';

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useProfile();
  const { data: statsData } = useWorkloadStats();
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);

  const profile = data?.data;
  const stats   = statsData?.data;

  const { mutate: update, isPending } = useMutation({
    mutationFn: (p) => staffApi.updateProfile(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated.');
      setEditing(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  if (isLoading) return <Spinner />;
  if (!profile) return <p className="text-gray-500 text-center py-16">Profile not found.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">
            {profile.full_name?.[0] || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
            <p className="text-gray-500 text-sm">{profile.employee_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Category</p>
              <p className="font-medium">{profile.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Building size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Assigned Block</p>
              <p className="font-medium">{profile.assigned_block || 'All Blocks'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="font-medium">{profile.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className={`font-medium ${profile.is_available ? 'text-green-600' : 'text-orange-500'}`}>
                {profile.is_available ? 'Available' : 'Unavailable'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit phone */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          {editing ? (
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={profile.phone || 'Enter phone number'}
                className="input-field flex-1"
              />
              <button
                onClick={() => update({ phone })}
                disabled={isPending}
                className="btn-primary"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          ) : (
            <button onClick={() => { setPhone(profile.phone || ''); setEditing(true); }} className="btn-secondary text-sm">
              ✏️ Update Phone Number
            </button>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Performance Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon="✅" label="Resolved"      value={stats?.total_resolved}  color="green"  />
          <StatCard icon="📋" label="Pending"       value={stats?.total_pending}   color="blue"   />
          <StatCard icon="⚙️" label="In Progress"   value={stats?.in_progress}     color="purple" />
        </div>
      </div>
    </div>
  );
}
