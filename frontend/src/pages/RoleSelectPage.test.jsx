import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import RoleSelectPage from './RoleSelectPage'

const mockNavigate = vi.fn()
const mockCompleteRoleSelection = vi.fn()

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ completeRoleSelection: mockCompleteRoleSelection }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders role selection options', () => {
  render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
  expect(screen.getByRole('button', { name: /continue as client/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /continue as worker/i })).toBeInTheDocument()
})

test('calls completeRoleSelection with client role', async () => {
  mockCompleteRoleSelection.mockResolvedValue(undefined)
  render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: /continue as client/i }))
  expect(mockCompleteRoleSelection).toHaveBeenCalledWith('client')
})

test('navigates to /jobs after client role selection', async () => {
  mockCompleteRoleSelection.mockResolvedValue(undefined)
  render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: /continue as client/i }))
  expect(mockNavigate).toHaveBeenCalledWith('/jobs')
})

test('navigates to /worker/browse after worker role selection', async () => {
  mockCompleteRoleSelection.mockResolvedValue(undefined)
  render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: /continue as worker/i }))
  expect(mockCompleteRoleSelection).toHaveBeenCalledWith('worker')
  expect(mockNavigate).toHaveBeenCalledWith('/worker/browse')
})
