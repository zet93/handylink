import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JobCard from './JobCard'

const mockJob = {
  id: '123',
  title: 'Fix leaky sink',
  category: 'Plumbing',
  city: 'Bucharest',
  country: 'RO',
  budgetMin: 100,
  budgetMax: 300,
  status: 'Open',
  bidCount: 0,
}

const renderCard = (job = mockJob) =>
  render(<MemoryRouter><JobCard job={job} /></MemoryRouter>)

test('renders job title', () => {
  renderCard()
  expect(screen.getByText('Fix leaky sink')).toBeInTheDocument()
})

test('renders category badge', () => {
  renderCard()
  expect(screen.getByText('Plumbing')).toBeInTheDocument()
})

test('renders city and country', () => {
  renderCard()
  expect(screen.getByText(/Bucharest/)).toBeInTheDocument()
})

test('shows "No bids yet" when bidCount is 0', () => {
  renderCard({ ...mockJob, bidCount: 0 })
  expect(screen.getByText(/no bids yet/i)).toBeInTheDocument()
})

test('shows bid count when greater than 0', () => {
  renderCard({ ...mockJob, bidCount: 3 })
  expect(screen.getByText(/3 bids/)).toBeInTheDocument()
})
