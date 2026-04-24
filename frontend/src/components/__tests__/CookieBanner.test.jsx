import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const mockOptIn = vi.fn()
const mockOptOut = vi.fn()
const mockGetStatus = vi.fn()

vi.mock('@posthog/react', () => ({
  usePostHog: () => ({
    opt_in_capturing: mockOptIn,
    opt_out_capturing: mockOptOut,
    get_explicit_consent_status: mockGetStatus,
  }),
}))

const { CookieBanner } = await import('../CookieBanner.jsx')

beforeEach(() => {
  vi.clearAllMocks()
})

test('does not render when consent is granted', () => {
  mockGetStatus.mockReturnValue('granted')
  const { container } = render(<CookieBanner />)
  expect(container.firstChild).toBeNull()
})

test('does not render when consent is denied', () => {
  mockGetStatus.mockReturnValue('denied')
  const { container } = render(<CookieBanner />)
  expect(container.firstChild).toBeNull()
})

test('renders banner when consent is pending', () => {
  mockGetStatus.mockReturnValue('pending')
  render(<CookieBanner />)
  expect(screen.getByText(/analytics cookies/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
})

test('calls opt_in_capturing on Accept', () => {
  mockGetStatus.mockReturnValue('pending')
  render(<CookieBanner />)
  fireEvent.click(screen.getByRole('button', { name: /accept/i }))
  expect(mockOptIn).toHaveBeenCalledTimes(1)
})

test('calls opt_out_capturing on Decline', () => {
  mockGetStatus.mockReturnValue('pending')
  render(<CookieBanner />)
  fireEvent.click(screen.getByRole('button', { name: /decline/i }))
  expect(mockOptOut).toHaveBeenCalledTimes(1)
})
