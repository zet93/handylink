import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/JobCard';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'furniture_assembly', 'cleaning', 'general', 'other'];
const STATUSES = ['open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function JobsPage() {
  const [filters, setFilters] = useState({ category: '', city: '', country: '', status: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.city) params.set('city', filters.city);
      if (filters.country) params.set('country', filters.country);
      if (filters.status) params.set('status', filters.status);
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
        <div>
          <label className="block text-xs text-gray-500 mb-1">Country</label>
          <input
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            value={filters.country}
            onChange={e => set('country', e.target.value)}
            placeholder="e.g. RO"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            value={filters.status}
            onChange={e => set('status', e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </aside>

      <div className="flex-1">
        {isLoading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : data?.items?.length === 0 ? (
          <p className="text-gray-500 text-sm">No jobs found.</p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {data?.items?.map(job => <JobCard key={job.id} job={job} />)}
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
    </div>
  );
}
