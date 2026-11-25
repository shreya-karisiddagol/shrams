import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Calls the shared auth service endpoint (your teammates' auth module)
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'maintenance_staff') {
        toast.error('Access denied. This portal is for maintenance staff only.');
        setLoading(false);
        return;
      }
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to backend! Is "node src/index.js" running on port 5000?');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email) => {
    setForm({ email, password: 'password123' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-600 text-white p-3 rounded-xl mb-3">
            <Wrench size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SHRAMS</h1>
          <p className="text-gray-500 text-sm mt-1">Staff Maintenance Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              placeholder="you@shrams.in"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
            Quick Demo Login
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('ravi.kumar@shrams.in')}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 px-3 rounded text-left transition-colors font-medium flex justify-between"
            >
              <span>⚡ Ravi Kumar</span>
              <span className="text-blue-500">Electrical</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('suresh.p@shrams.in')}
              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-1.5 px-3 rounded text-left transition-colors font-medium flex justify-between"
            >
              <span>⚡ Suresh Plumber</span>
              <span className="text-indigo-500">Plumbing</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('mohan.c@shrams.in')}
              className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 py-1.5 px-3 rounded text-left transition-colors font-medium flex justify-between"
            >
              <span>⚡ Mohan Carpenter</span>
              <span className="text-amber-500">Carpentry</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Contact your administrator to reset your password.
        </p>
      </div>
    </div>
  );
}
