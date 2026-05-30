import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import MyPostsList from '../MyPostsList'
import { mockJob } from './mocks'

vi.mock('@/lib/api/jobs', () => ({
  useDeleteJob: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCloseJob: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJobApplications: () => ({ data: { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }, isLoading: false }),
  useAcceptApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRejectApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateApplicationStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/api', () => ({
  useDeleteJob: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCloseJob: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useJobApplications: () => ({ data: { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }, isLoading: false }),
  useAcceptApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRejectApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateApplicationStatus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('MyPostsList', () => {
  it('renders job title in the list', () => {
    render(<MyPostsList jobs={[mockJob]} statusFilter="all" />, { wrapper })
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
  })

  it('shows empty state when no jobs match filter', () => {
    render(<MyPostsList jobs={[mockJob]} statusFilter="CLOSED" />, { wrapper })
    expect(screen.getByRole('heading', { name: /إعلانات/i })).toBeInTheDocument()
  })

  it('renders multiple jobs', () => {
    const jobs = [
      { ...mockJob, id: 'job-1', title: 'سائق أول' },
      { ...mockJob, id: 'job-2', title: 'سائق ثاني' },
    ]
    render(<MyPostsList jobs={jobs} statusFilter="all" />, { wrapper })
    expect(screen.getByText('سائق أول')).toBeInTheDocument()
    expect(screen.getByText('سائق ثاني')).toBeInTheDocument()
  })

  it('renders empty state when jobs array is empty', () => {
    render(<MyPostsList jobs={[]} statusFilter="all" />, { wrapper })
    expect(screen.getByRole('heading', { name: /إعلانات/i })).toBeInTheDocument()
  })
})
