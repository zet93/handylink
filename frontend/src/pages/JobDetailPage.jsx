import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import PaymentForm from '../components/PaymentForm';
import AuthPromptModal from '../components/AuthPromptModal';
import JobMap from '../components/JobMap';

const bidSchema = z.object({
  priceEstimate: z.coerce.number().positive('Must be a positive number'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const STATUS_LABELS = {
  open: 'Open',
  bidding: 'Accepting bids',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function ClientView({ job, bids, onStatusChange }) {
  const queryClient = useQueryClient();

  const accept = useMutation({
    mutationFn: id => axiosClient.patch(`/api/bids/${id}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', job.id] }),
  });
  const reject = useMutation({
    mutationFn: id => axiosClient.patch(`/api/bids/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bids', job.id] }),
  });

  return (
    <div>
      <div className="flex gap-3 mb-6">
        {job.status === 'accepted' && (
          <button
            onClick={() => onStatusChange('in_progress')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Mark as In Progress
          </button>
        )}
        {job.status === 'in_progress' && (
          <PaymentForm jobId={job.id} />
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">Bids ({bids.length})</h2>
      {bids.length === 0 ? (
        <p className="text-gray-500 text-sm">No bids yet.</p>
      ) : (
        <div className="space-y-3">
          {bids.map(bid => (
            <div key={bid.id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">Worker ID: {bid.workerId.slice(0, 8)}…</p>
                  <p className="text-lg font-bold text-blue-600">{bid.priceEstimate} RON</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  bid.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {bid.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{bid.message}</p>
              {bid.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => accept.mutate(bid.id)}
                    disabled={accept.isPending}
                    className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => reject.mutate(bid.id)}
                    disabled={reject.isPending}
                    className="border text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerView({ job, bids, userId }) {
  const queryClient = useQueryClient();
  const myBid = bids.find(b => b.workerId === userId);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(bidSchema),
  });

  const submitBid = useMutation({
    mutationFn: data => axiosClient.post(`/api/jobs/${job.id}/bids`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids', job.id] });
      reset();
    },
  });

  if (myBid) {
    return (
      <div className="border rounded-xl p-4 bg-white">
        <h2 className="font-semibold mb-2">Your bid</h2>
        <p className="text-xl font-bold text-blue-600 mb-1">{myBid.priceEstimate} RON</p>
        <p className="text-sm text-gray-600 mb-3">{myBid.message}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
          myBid.status === 'accepted' ? 'bg-green-100 text-green-700' :
          myBid.status === 'rejected' ? 'bg-red-100 text-red-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {myBid.status}
        </span>
      </div>
    );
  }

  if (job.status !== 'open' && job.status !== 'bidding') {
    return <p className="text-gray-500 text-sm">This job is no longer accepting bids.</p>;
  }

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h2 className="font-semibold mb-4">Submit a bid</h2>
      <form
        onSubmit={handleSubmit(data => submitBid.mutate(data))}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Price estimate (RON)</label>
          <input
            {...register('priceEstimate')}
            type="number"
            step="0.01"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.priceEstimate && <p className="text-red-500 text-xs mt-1">{errors.priceEstimate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            {...register('message')}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your approach and availability…"
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
        </div>
        {submitBid.isError && (
          <p className="text-red-500 text-sm">{submitBid.error?.response?.data?.error ?? 'Failed to submit bid'}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || submitBid.isPending}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitBid.isPending ? 'Submitting…' : 'Submit bid'}
        </button>
      </form>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => axiosClient.get(`/api/jobs/${id}`).then(r => r.data),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids', id],
    queryFn: () => axiosClient.get(`/api/jobs/${id}/bids`).then(r => r.data),
    enabled: !!job && !!user,
  });

  const updateStatus = useMutation({
    mutationFn: status => axiosClient.patch(`/api/jobs/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id] }),
  });

  if (jobLoading) return <div className="p-6 text-gray-400 text-sm">Loading…</div>;
  if (!job) return <div className="p-6 text-gray-500">Job not found.</div>;

  const isOwner = userProfile?.id === job.clientId;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border rounded-xl p-6 mb-6">
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Secure your work: Workers should submit a bid using the form, and clients can choose the best offer and proceed by marking in progress. Communicate openly in bid messages.</div>

        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full capitalize whitespace-nowrap ${
            job.status === 'open' || job.status === 'bidding' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
        </div>
        <p className="text-gray-700 mb-4">{job.description}</p>
        {job.latitude && job.longitude && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Location</h2>
            <JobMap latitude={job.latitude} longitude={job.longitude} address={job.address} />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600">
          <div><span className="font-medium">Category:</span> {job.category.replace('_', ' ')}</div>
          <div><span className="font-medium">Location:</span> {job.city}, {job.country}</div>
          {job.budgetMin && <div><span className="font-medium">Min:</span> {job.budgetMin} RON</div>}
          {job.budgetMax && <div><span className="font-medium">Max:</span> {job.budgetMax} RON</div>}
        </div>
      </div>

      {isOwner ? (
        <ClientView job={job} bids={bids} onStatusChange={s => updateStatus.mutate(s)} />
      ) : user ? (
        <WorkerView job={job} bids={bids} userId={userProfile?.id} />
      ) : (job.status === 'open' || job.status === 'bidding') ? (
        <div className="border rounded-xl p-4 bg-white text-center">
          <h2 className="font-semibold mb-2">Interested in this job?</h2>
          <p className="text-sm text-gray-500 mb-4">Log in to submit a bid.</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Submit a Bid
          </button>
          <AuthPromptModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            returnPath={location.pathname}
          />
        </div>
      ) : null}
    </div>
  );
}
