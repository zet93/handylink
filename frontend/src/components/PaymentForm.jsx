import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useQueryClient } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';

export default function PaymentForm({ jobId }) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosClient.post('/api/payments/create-intent', { jobId });
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="border rounded-xl p-4 bg-green-50">
        <p className="text-green-700 font-medium">Payment successful! The job is now complete.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-3 text-sm">Pay for this job</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="border rounded-lg px-3 py-2.5">
          <CardElement options={{ style: { base: { fontSize: '14px', color: '#111827' } } }} />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing…' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
}
