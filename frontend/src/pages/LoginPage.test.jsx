import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LoginPage from './LoginPage'

const mockNavigate = vi.fn()
const mockSignIn = vi.fn()

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders email and password inputs', () => {
  const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
  expect(container.querySelector('input[type="email"]')).toBeInTheDocument()
  expect(container.querySelector('input[type="password"]')).toBeInTheDocument()
})

test('calls signIn with correct credentials on valid submit', async () => {
  mockSignIn.mockResolvedValue({ error: null })
  const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
  await userEvent.type(container.querySelector('input[type="email"]'), 'user@test.com')
  await userEvent.type(container.querySelector('input[type="password"]'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(mockSignIn).toHaveBeenCalledWith('user@test.com', 'password123')
})

test('navigates to /jobs on successful login', async () => {
  mockSignIn.mockResolvedValue({ error: null })
  const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
  await userEvent.type(container.querySelector('input[type="email"]'), 'user@test.com')
  await userEvent.type(container.querySelector('input[type="password"]'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(mockNavigate).toHaveBeenCalledWith('/jobs')
})

test('shows error when signIn returns error', async () => {
  mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
  const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
  await userEvent.type(container.querySelector('input[type="email"]'), 'bad@test.com')
  await userEvent.type(container.querySelector('input[type="password"]'), 'wrongpass')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
})
