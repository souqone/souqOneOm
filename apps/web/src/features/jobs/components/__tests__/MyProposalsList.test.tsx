import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import MyProposalsList from '../MyProposalsList'
import { mockApplication } from './mocks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('MyProposalsList', () => {
  it('renders job title from application', () => {
    render(
      <MyProposalsList
        applications={[mockApplication]}
        statusFilter="all"
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByText(mockApplication.job!.title)).toBeInTheDocument()
  })

  it('shows empty state when no applications', () => {
    render(
      <MyProposalsList
        applications={[]}
        statusFilter="all"
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByRole('heading', { name: /عروض/i })).toBeInTheDocument()
  })

  it('filters by status correctly', () => {
    const apps = [
      { ...mockApplication, id: 'app-1', status: 'PENDING' as const },
      { ...mockApplication, id: 'app-2', status: 'ACCEPTED' as const, job: { ...mockApplication.job!, title: 'وظيفة مقبولة' } },
    ]
    render(
      <MyProposalsList
        applications={apps}
        statusFilter="ACCEPTED"
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByText('وظيفة مقبولة')).toBeInTheDocument()
    expect(screen.queryByText(mockApplication.job!.title)).not.toBeInTheDocument()
  })

  it('shows withdraw button for PENDING applications', () => {
    render(
      <MyProposalsList
        applications={[mockApplication]}
        statusFilter="all"
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByRole('button', { name: /سحب/i })).toBeInTheDocument()
  })
})
