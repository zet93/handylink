import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePostHog } from '@posthog/react';
import axiosClient from '../api/axiosClient';
import LocationPicker from '../components/LocationPicker';
import CountyCityPicker from '../components/CountyCityPicker';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'furniture_assembly', 'cleaning', 'general', 'other'];

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(CATEGORIES),
  county: z.string().min(1, 'Județul este obligatoriu'),
  city: z.string().min(1, 'Orașul este obligatoriu'),
  budgetMin: z.coerce.number().positive().optional().or(z.literal('')),
  budgetMax: z.coerce.number().positive().optional().or(z.literal('')),
});

export default function PostJobPage() {
  const navigate = useNavigate();
  const posthog = usePostHog()
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: null });
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValue, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'general' },
  });

  async function handleCitySelect(cityName) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data[0]) {
      setLocation({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: cityName,
      });
    }
  }

  async function onSubmit(data) {
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      city: data.city,
      county: data.county,
      country: 'RO',
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
      posthog?.capture('job_posted', { category: payload.category })
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
        <CountyCityPicker
          register={register}
          control={control}
          setValue={setValue}
          errors={errors}
          onCitySelect={handleCitySelect}
        />
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
