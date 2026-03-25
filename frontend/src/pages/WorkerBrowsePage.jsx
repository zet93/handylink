import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import JobCard from '../components/JobCard';
import axiosClient from '../api/axiosClient';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'furniture_assembly', 'cleaning', 'general', 'other'];

const bidSchema = z.object({
  priceEstimate: z.coerce.number().positive('Must be a positive number'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

function QuickBidPanel({ job, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(bidSchema),
  });

  const submitBid = useMutation({
    mutationFn: data => axiosClient.post(`/api/jobs/${job.id}/bids`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browse-jobs'] });
      reset();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-96 bg-white h-full shadow-xl flex flex-col z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Quick Bid</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="p-5 border-b bg-gray-50">
          <p className="font-medium text-sm">{job.title}</p>
          <p className="text-xs text-gray-500 mt-1">{job.city}, {job.country} · {job.category.replace('_', ' ')}</p>
        </div>
        <form
          onSubmit={handleSubmit(data => submitBid.mutate(data))}
          className="p-5 flex-1 flex flex-col gap-4"
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
              rows={4}
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
            disabled={submitBid.isPending}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mt-auto"
          >
            {submitBid.isPending ? 'Submitting…' : 'Submit bid'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function WorkerBrowsePage() {
  const [filters, setFilters] = useState({ category: '', city: '', page: 1 });
  const [selectedJob, setSelectedJob] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['browse-jobs', filters],
    queryFn: () => {
      const params = new URLSearchParams({ status: 'open' });
      if (filters.category) params.set('category', filters.category);
      if (filters.city) params.set('city', filters.city);
      params.set('page', filters.page);
      return axiosClient.get(`/api/jobs?${params}`).then(r => r.data);
    },
  });

  function set(key, value) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }

  return (
    <div className="flex gap-6 p-6 max-w-6xl mx-auto">
      <aside className="w-56 shrink-0 space-y-4">
        <h2 className="font-semibold text-gray-800">Filters</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            value={filters.category}
            onChange={e => set('category', e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">City</label>
          <input
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            value={filters.city}
            onChange={e => set('city', e.target.value)}
            placeholder="e.g. Bucharest"
          />
        </div>
      </aside>

      <div className="flex-1">
        <h1 className="text-xl font-bold mb-4">Open jobs</h1>
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : data?.items?.length === 0 ? (
          <p className="text-gray-500 text-sm">No open jobs found.</p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {data?.items?.map(job => (
                <div key={job.id} className="relative">
                  <JobCard job={job} />
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 z-10"
                  >
                    Quick Bid
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-500">Page {filters.page}</span>
              <button
                disabled={!data?.items?.length || data.items.length < 20}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {selectedJob && (
        <QuickBidPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
