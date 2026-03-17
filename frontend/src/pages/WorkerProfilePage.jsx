import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
      ))}
    </div>
  );
}

export default function WorkerProfilePage() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [connectLoading, setConnectLoading] = useState(false);
  const isOwnProfile = userProfile?.id === id;

  async function handleConnectStripe() {
    setConnectLoading(true);
    try {
      const { data } = await axiosClient.post('/api/payments/connect-onboard');
      window.location.href = data.onboardingUrl;
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to start Stripe onboarding.');
      setConnectLoading(false);
    }
  }

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => axiosClient.get(`/api/workers/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="p-6 text-gray-400 text-sm">Loading…</div>;
  if (!worker) return <div className="p-6 text-gray-500">Worker not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl shrink-0">
            {worker.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{worker.fullName}</h1>
              {worker.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">✓ Verified</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {[worker.city, worker.country].filter(Boolean).join(', ')}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <StarRating value={worker.averageRating} />
              <span className="text-sm text-gray-600">
                {worker.averageRating.toFixed(1)} ({worker.totalReviews} reviews)
              </span>
            </div>
            {worker.bio && <p className="text-sm text-gray-700">{worker.bio}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-3">Skills & experience</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {worker.categories.map(c => (
            <span key={c} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full capitalize">
              {c.replace('_', ' ')}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-600">{worker.yearsExperience} year{worker.yearsExperience !== 1 ? 's' : ''} of experience</p>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Reviews</h2>
        <p className="text-sm text-gray-500">No reviews yet.</p>
      </div>

      {isOwnProfile && (
        <div className="bg-white border rounded-xl p-6 mt-6">
          <h2 className="font-semibold mb-1">Stripe Payouts</h2>
          <p className="text-sm text-gray-500 mb-4">
            {worker.stripeAccountId
              ? 'Your Stripe account is connected. You can re-open onboarding to update your details.'
              : 'Connect your Stripe account to receive payments from clients.'}
          </p>
          <button
            onClick={handleConnectStripe}
            disabled={connectLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {connectLoading ? 'Redirecting…' : worker.stripeAccountId ? 'Manage Stripe Account' : 'Connect to Stripe'}
          </button>
        </div>
      )}
    </div>
  );
}
