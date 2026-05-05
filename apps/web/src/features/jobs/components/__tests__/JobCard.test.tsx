import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import JobCard from '../JobCard'
import { mockJob } from './mocks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('JobCard', () => {
  it('renders job title', () => {
    render(<JobCard job={mockJob} />, { wrapper })
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
  })

  it('shows HIRING badge when jobType is HIRING', () => {
    render(<JobCard job={{ ...mockJob, jobType: 'HIRING' }} />, { wrapper })
    expect(screen.getByText('طلب سائق')).toBeInTheDocument()
  })

  it('shows OFFERING badge when jobType is OFFERING', () => {
    render(<JobCard job={{ ...mockJob, jobType: 'OFFERING' }} />, { wrapper })
    expect(screen.getByText('عرض خدمة')).toBeInTheDocument()
  })

  it('shows salary when provided', () => {
    render(<JobCard job={{ ...mockJob, salary: 500, salaryPeriod: 'MONTHLY' }} />, { wrapper })
    expect(screen.getByText(/٥٠٠|500|ر\.ع\./)).toBeInTheDocument()
  })

  it('shows governorate', () => {
    render(<JobCard job={mockJob} />, { wrapper })
    expect(screen.getByText(new RegExp(mockJob.governorate))).toBeInTheDocument()
  })

  it('links to job detail page', () => {
    render(<JobCard job={mockJob} />, { wrapper })
    const links = screen.getAllByRole('link')
    const jobLink = links.find(l => l.getAttribute('href')?.includes(mockJob.id) || l.getAttribute('href')?.includes(mockJob.slug))
    expect(jobLink).toBeTruthy()
  })
})
