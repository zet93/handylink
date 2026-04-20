import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../api/axiosClient';
import LocationPicker from '../components/LocationPicker';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'furniture_assembly', 'cleaning', 'general', 'other'];

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(CATEGORIES),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  budgetMin: z.coerce.number().positive().optional().or(z.literal('')),
  budgetMax: z.coerce.number().positive().optional().or(z.literal('')),
});

export default function PostJobPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: null });
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: 'RO', category: 'general' },
  });

  async function onSubmit(data) {
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      city: data.city,
      country: data.country,
      budgetMin: data.budgetMin || null,
      budgetMax: data.budgetMax || null,
      photos: [],
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      address: location.address || null,
    };
    try {
      const res = await axiosClient.post('/api/jobs', payload);
      navigate(`/jobs/${res.data.id}`);
    } catch (err) {
      setError('root', { message: err.response?.data?.error ?? 'Failed to post job' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Post a job</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            {...register('title')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Fix leaking kitchen tap"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the work needed in detail…"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            {...register('category')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              {...register('city')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Bucharest"
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              {...register('country')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
          </div>
        </div>
        <LocationPicker
          latitude={location.latitude}
          longitude={location.longitude}
          address={location.address}
          onChange={setLocation}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget min (RON)</label>
            <input
              {...register('budgetMin')}
              type="number"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
            {errors.budgetMin && <p className="text-red-500 text-xs mt-1">{errors.budgetMin.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Budget max (RON)</label>
            <input
              {...register('budgetMax')}
              type="number"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
            {errors.budgetMax && <p className="text-red-500 text-xs mt-1">{errors.budgetMax.message}</p>}
          </div>
        </div>
        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  );
}
