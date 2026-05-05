import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import DriverCard from '../DriverCard'
import { mockDriver } from './mocks'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('DriverCard', () => {
  it('renders driver display name', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    expect(screen.getByText(mockDriver.user.displayName!)).toBeInTheDocument()
  })

  it('renders license type badges', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    expect(screen.getAllByText(/رخصة|ثقيلة|خفيفة/i).length).toBeGreaterThan(0)
  })

  it('links to driver profile page', () => {
    render(<DriverCard driver={mockDriver} />, { wrapper })
    const link = screen.getByRole('link', { name: /عرض الملف/i })
    expect(link).toHaveAttribute('href', `/jobs/drivers/${mockDriver.id}`)
  })

  it('shows availability status', () => {
    render(<DriverCard driver={{ ...mockDriver, isAvailable: true }} />, { wrapper })
    expect(screen.getByText(/متاح/i)).toBeInTheDocument()
  })

  it('shows unavailable when not available', () => {
    render(<DriverCard driver={{ ...mockDriver, isAvailable: false }} />, { wrapper })
    expect(screen.getByText(/غير متاح/i)).toBeInTheDocument()
  })
})
