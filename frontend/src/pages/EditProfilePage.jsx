import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import LocationPicker from '../components/LocationPicker';

function RadiusSelector({ value, onChange }) {
  const options = [10, 20, 50, 100];
  return (
    <div className="flex gap-2">
      {options.map(km => (
        <button
          key={km}
          type="button"
          onClick={() => onChange(km)}
          className={`px-4 py-2 rounded-lg text-sm ${
            value === km
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-50 text-gray-900 border border-gray-300'
          }`}
        >
          {km} km
        </button>
      ))}
    </div>
  );
}

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  bio: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
});

export default function EditProfilePage() {
  const { userProfile } = useAuth();
  const [workerLocation, setWorkerLocation] = useState({ latitude: null, longitude: null, address: null });
  const [radiusKm, setRadiusKm] = useState(20);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (userProfile) {
      reset({
        fullName: userProfile.full_name ?? '',
        bio: userProfile.bio ?? '',
        city: userProfile.city ?? '',
        country: userProfile.country ?? '',
        phone: userProfile.phone ?? '',
      });
    }
  }, [userProfile, reset]);

  async function onSubmit(data) {
    try {
      const calls = [
        axiosClient.put('/api/users/me', {
          fullName: data.fullName,
          bio: data.bio || null,
          city: data.city || null,
          country: data.country || null,
          phone: data.phone || null,
          avatarUrl: userProfile?.avatar_url ?? null,
        }),
      ];
      if (isWorker) {
        calls.push(
          axiosClient.put('/api/users/me/location', {
            latitude: workerLocation.latitude,
            longitude: workerLocation.longitude,
            serviceRadiusKm: workerLocation.latitude ? radiusKm : null,
          })
        );
      }
      await Promise.all(calls);
      reset(data);
    } catch (err) {
      setError('root', { message: err.response?.data?.error ?? 'Failed to save profile' });
    }
  }

  const isWorker = userProfile?.role === 'worker' || userProfile?.role === 'both';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-xl p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-gray-700">Personal info</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            {...register('fullName')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell clients about yourself…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              {...register('city')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              {...register('country')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {isWorker && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-700 mb-3">Worker details</h2>
          <p className="text-sm text-gray-500 mb-4">
            Categories and years of experience editing will be available in a future update.
          </p>
          {userProfile?.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {userProfile.categories.map(c => (
                <span key={c} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full capitalize">
                  {c.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isWorker && (
        <div className="bg-white border rounded-xl p-6 mt-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Service Area (optional)</h2>
            <LocationPicker
              latitude={workerLocation.latitude}
              longitude={workerLocation.longitude}
              address={workerLocation.address}
              onChange={setWorkerLocation}
            />
            {workerLocation.latitude && (
              <div>
                <label className="block text-sm font-semibold mb-1">Work radius</label>
                <RadiusSelector value={radiusKm} onChange={setRadiusKm} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
