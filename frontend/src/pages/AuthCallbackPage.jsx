import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!userProfile) {
      navigate('/select-role');
    } else {
      const dest = userProfile.role === 'worker' ? '/worker/browse' : '/jobs';
      navigate(dest);
    }
  }, [user, userProfile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Completing sign-in…</p>
    </div>
  );
}
