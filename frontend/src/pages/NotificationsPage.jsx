import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axiosClient.get('/api/notifications').then(r => r.data),
  });

  async function markRead(notification) {
    if (!notification.isRead) {
      await axiosClient.patch(`/api/notifications/${notification.id}/read`);
      queryClient.setQueryData(['notifications'], prev =>
        prev?.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }
    if (notification.referenceId) {
      navigate(`/jobs/${notification.referenceId}`);
    }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => axiosClient.patch(`/api/notifications/${n.id}/read`)));
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  const todayItems = notifications.filter(n => isToday(n.createdAt));
  const earlierItems = notifications.filter(n => !isToday(n.createdAt));
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications yet.</p>
      ) : (
        <div className="space-y-6">
          {todayItems.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Today</h2>
              <div className="space-y-1">
                {todayItems.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 flex items-start gap-3 ${!n.isRead ? 'bg-blue-50' : 'bg-white border'}`}
                  >
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                    {n.isRead && <span className="w-2 h-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-gray-600 truncate">{n.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {earlierItems.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Earlier</h2>
              <div className="space-y-1">
                {earlierItems.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 flex items-start gap-3 ${!n.isRead ? 'bg-blue-50' : 'bg-white border'}`}
                  >
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                    {n.isRead && <span className="w-2 h-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-gray-600 truncate">{n.body}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
