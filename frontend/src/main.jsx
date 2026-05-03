import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from './lib/posthog.js'
import { PostHogProvider } from '@posthog/react'
import * as Sentry from '@sentry/react'
import { CookieBanner } from './components/CookieBanner.jsx'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
      <CookieBanner />
    </PostHogProvider>
  </StrictMode>,
)
