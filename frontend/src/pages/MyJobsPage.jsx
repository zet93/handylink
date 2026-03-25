import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import axiosClient from '../api/axiosClient';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'bidding', label: 'Bidding' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyJobsPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('open');

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs', userProfile?.id, activeTab],
    queryFn: () => {
      const params = new URLSearchParams({ clientId: userProfile.id, status: activeTab, pageSize: 50 });
      return axiosClient.get(`/api/jobs?${params}`).then(r => r.data);
    },
    enabled: !!userProfile?.id,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link
          to="/post-job"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Post a new job
        </Link>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : data?.items?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm mb-4">No {activeTab.replace('_', ' ')} jobs.</p>
          {activeTab === 'open' && (
            <Link to="/post-job" className="text-blue-600 text-sm hover:underline">
              Post your first job →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items?.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
