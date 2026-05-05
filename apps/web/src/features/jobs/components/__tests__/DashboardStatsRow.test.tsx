import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import DashboardStatsRow from '../DashboardStatsRow'

describe('DashboardStatsRow', () => {
  it('renders without crashing as employer', () => {
    render(
      <DashboardStatsRow
        isEmployer={true}
        totalPosts={5}
        totalProposals={12}
        acceptedCount={3}
        activeCount={2}
      />
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders without crashing as driver', () => {
    render(
      <DashboardStatsRow
        isEmployer={false}
        totalPosts={0}
        totalProposals={8}
        acceptedCount={2}
        activeCount={1}
      />
    )
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders 4 stat cards', () => {
    const { container } = render(
      <DashboardStatsRow
        isEmployer={true}
        totalPosts={5}
        totalProposals={12}
        acceptedCount={3}
        activeCount={2}
      />
    )
    const cards = container.querySelectorAll('.card-base')
    expect(cards.length).toBe(4)
  })

  it('shows accepted count', () => {
    render(
      <DashboardStatsRow
        isEmployer={true}
        totalPosts={5}
        totalProposals={12}
        acceptedCount={3}
        activeCount={2}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
