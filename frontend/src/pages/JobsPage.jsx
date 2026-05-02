import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import JobCard from '../components/JobCard';
import { getCategoryLabel, CATEGORY_KEYS } from '../constants/categories';

const STATUSES = ['open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function JobsPage() {
  const [filters, setFilters] = useState({ category: '', city: '', status: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.city) params.set('city', filters.city);
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
            {CATEGORY_KEYS.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
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
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-xl p-4 animate-pulse bg-white">
                <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
                <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <Briefcase size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">Nu am găsit lucrări care să corespundă filtrelor.</p>
            <p className="text-xs">Încearcă să schimbi categoria sau orașul.</p>
          </div>
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
