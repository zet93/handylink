import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://eu.i.posthog.com',
  defaults: '2026-01-30',
  cookieless_mode: 'on_reject',
})

export default posthog
