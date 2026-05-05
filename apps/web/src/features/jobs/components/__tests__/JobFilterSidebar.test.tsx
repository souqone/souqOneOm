import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import JobFilterSidebar from '../JobFilterSidebar'
import { mockFilters } from './mocks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('JobFilterSidebar', () => {
  it('renders without crashing', () => {
    render(
      <JobFilterSidebar
        filters={mockFilters}
        onChange={vi.fn()}
        onClear={vi.fn()}
        totalCount={10}
      />,
      { wrapper }
    )
    expect(screen.getByText(/10/)).toBeInTheDocument()
  })

  it('shows job type filter options', () => {
    render(
      <JobFilterSidebar
        filters={mockFilters}
        onChange={vi.fn()}
        onClear={vi.fn()}
        totalCount={0}
      />,
      { wrapper }
    )
    expect(screen.getByText(/توظيف|نوع الوظيفة/i)).toBeInTheDocument()
  })

  it('calls onChange when a filter is selected', () => {
    const onChange = vi.fn()
    render(
      <JobFilterSidebar
        filters={mockFilters}
        onChange={onChange}
        onClear={vi.fn()}
        totalCount={0}
      />,
      { wrapper }
    )
    const selects = screen.getAllByRole('combobox')
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: 'HIRING' } })
      expect(onChange).toHaveBeenCalled()
    }
  })
})
