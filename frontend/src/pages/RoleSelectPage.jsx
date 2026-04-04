import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'client', label: 'I need work done', description: 'Post jobs, hire workers' },
  { value: 'worker', label: 'I offer services', description: 'Browse jobs, place bids' },
  { value: 'both', label: 'Both', description: 'Post jobs and offer services' },
];

const DESTINATIONS = { client: '/jobs', worker: '/worker/browse', both: '/jobs' };

export default function RoleSelectPage() {
  const { completeRoleSelection } = useAuth();
  const navigate = useNavigate();

  async function handleSelect(role) {
    await completeRoleSelection(role);
    navigate(DESTINATIONS[role]);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to HandyLink</h1>
        <p className="text-gray-600 mb-6">How do you want to use HandyLink?</p>
        <div className="space-y-3">
          {ROLES.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              className="w-full text-left border rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">Continue as {value}</div>
              <div className="text-sm text-gray-500">{label} — {description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
