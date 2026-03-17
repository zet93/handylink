import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'furniture_assembly', 'cleaning', 'general', 'other'];
const STATUSES = ['open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 leading-tight">{job.title}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap capitalize">
          {job.category.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{job.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>📍 {job.city}, {job.country}</span>
        {(job.budgetMin || job.budgetMax) && (
          <span>
            {job.budgetMin && job.budgetMax
              ? `${job.budgetMin}–${job.budgetMax} RON`
              : job.budgetMin
              ? `From ${job.budgetMin} RON`
              : `Up to ${job.budgetMax} RON`}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full capitalize ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {job.status.replace('_', ' ')}
        </span>
        <span>{timeAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}

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
