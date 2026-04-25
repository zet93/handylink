import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import PostJobPage from './PostJobPage'
import axiosClient from '../api/axiosClient'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}))

vi.mock('../api/axiosClient', () => ({
  default: { post: vi.fn() },
}))

vi.mock('../components/CountyCityPicker', () => ({
  default: function MockCountyCityPicker({ register, setValue }) {
    return (
      <div>
        <label htmlFor="county-select">Județ</label>
        <select
          id="county-select"
          {...register('county')}
          onChange={e => setValue('county', e.target.value, { shouldDirty: true })}
        >
          <option value="">Selectează județul…</option>
          <option value="B">București</option>
        </select>
        <label htmlFor="city-select">Oraș / Comună</label>
        <select
          id="city-select"
          {...register('city')}
          onChange={e => setValue('city', e.target.value, { shouldDirty: true })}
        >
          <option value="">Selectează orașul…</option>
          <option value="Sector 1">Sector 1</option>
        </select>
      </div>
    )
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders key form fields', () => {
  render(<MemoryRouter><PostJobPage /></MemoryRouter>)
  expect(screen.getByPlaceholderText('e.g. Fix leaking kitchen tap')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Describe the work needed in detail…')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /post job/i })).toBeInTheDocument()
})

test('shows validation error on empty title submit', async () => {
  render(<MemoryRouter><PostJobPage /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: /post job/i }))
  expect(await screen.findByText(/title must be at least 5 characters/i)).toBeInTheDocument()
})

test('calls axiosClient.post and navigates on valid submit', async () => {
  axiosClient.post.mockResolvedValue({ data: { id: 'abc123' } })
  render(<MemoryRouter><PostJobPage /></MemoryRouter>)

  await userEvent.type(screen.getByPlaceholderText('e.g. Fix leaking kitchen tap'), 'Fixing the kitchen tap now')
  await userEvent.type(
    screen.getByPlaceholderText('Describe the work needed in detail…'),
    'The tap is leaking badly and needs professional repair urgently'
  )
  await userEvent.selectOptions(screen.getByLabelText('Județ'), 'B')
  await userEvent.selectOptions(screen.getByLabelText('Oraș / Comună'), 'Sector 1')

  await userEvent.click(screen.getByRole('button', { name: /post job/i }))

  expect(axiosClient.post).toHaveBeenCalledWith('/api/jobs', expect.objectContaining({
    title: 'Fixing the kitchen tap now',
    category: 'general',
    city: 'Sector 1',
    county: 'B',
    country: 'RO',
  }))
  expect(mockNavigate).toHaveBeenCalledWith('/jobs/abc123')
})
