import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axiosClient.get('/api/notifications').then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleClick(notification) {
    if (!notification.isRead) {
      await axiosClient.patch(`/api/notifications/${notification.id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    setOpen(false);
    if (notification.referenceId) navigate(`/jobs/${notification.referenceId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2 border-b flex justify-between items-center">
            <span className="font-semibold text-sm">Notifications</span>
            <Link to="/notifications" className="text-blue-600 text-xs hover:underline" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {notifications.slice(0, 5).length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
          ) : (
            notifications.slice(0, 5).map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 ${!n.isRead ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500 truncate">{n.body}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const isWorker = userProfile?.role === 'worker' || userProfile?.role === 'both';

  if (!user) {
    return (
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-lg text-blue-600">HandyLink</Link>
          <Link to="/jobs" className="text-sm text-gray-700 hover:text-blue-600">Jobs</Link>
          <Link to="/worker/browse" className="text-sm text-gray-700 hover:text-blue-600">Browse Workers</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600">Log in</Link>
          <Link to="/register" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">Register</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg text-blue-600">HandyLink</Link>
        <Link to="/jobs" className="text-sm text-gray-700 hover:text-blue-600">Jobs</Link>
        {isWorker && (
          <Link to="/worker/browse" className="text-sm text-gray-700 hover:text-blue-600">Browse Jobs</Link>
        )}
        <Link to="/post-job" className="text-sm text-gray-700 hover:text-blue-600">Post a Job</Link>
        <Link to="/my-jobs" className="text-sm text-gray-700 hover:text-blue-600">My Jobs</Link>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600">
          {userProfile?.full_name ?? 'Profile'}
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
