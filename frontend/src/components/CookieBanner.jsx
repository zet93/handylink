import { useState } from 'react'
import { usePostHog } from '@posthog/react'

export function CookieBanner() {
  const posthog = usePostHog()
  const [status, setStatus] = useState(() => posthog?.get_explicit_consent_status?.() ?? 'pending')

  if (status !== 'pending') return null

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between z-50">
      <p className="text-sm text-gray-700 text-center sm:text-left">
        We use analytics cookies to improve HandyLink. You can opt out at any time.
      </p>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => { posthog?.opt_in_capturing(); setStatus('granted') }}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Accept
        </button>
        <button
          onClick={() => { posthog?.opt_out_capturing(); setStatus('denied') }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
