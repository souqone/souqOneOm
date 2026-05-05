import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ProposalCard from '../ProposalCard'
import { mockApplication } from './mocks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('ProposalCard', () => {
  it('renders applicant name', () => {
    render(
      <ProposalCard
        application={mockApplication}
        isJobOwner={false}
        isOwnProposal={true}
        isAuthenticated={true}
      />,
      { wrapper }
    )
    expect(screen.getByText(mockApplication.applicant!.displayName!)).toBeInTheDocument()
  })

  it('shows ACCEPTED status badge', () => {
    render(
      <ProposalCard
        application={{ ...mockApplication, status: 'ACCEPTED' }}
        isJobOwner={false}
        isOwnProposal={true}
        isAuthenticated={true}
      />,
      { wrapper }
    )
    expect(screen.getByText(/مقبول/i)).toBeInTheDocument()
  })

  it('shows withdraw button when status is PENDING and isOwnProposal', () => {
    render(
      <ProposalCard
        application={{ ...mockApplication, status: 'PENDING' }}
        isJobOwner={false}
        isOwnProposal={true}
        isAuthenticated={true}
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.getByRole('button', { name: /سحب/i })).toBeInTheDocument()
  })

  it('does not show withdraw button when status is ACCEPTED', () => {
    render(
      <ProposalCard
        application={{ ...mockApplication, status: 'ACCEPTED' }}
        isJobOwner={false}
        isOwnProposal={true}
        isAuthenticated={true}
        onWithdraw={vi.fn()}
      />,
      { wrapper }
    )
    expect(screen.queryByRole('button', { name: /سحب/i })).not.toBeInTheDocument()
  })
})
