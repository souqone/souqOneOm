import { AuthGuard } from '@/components/auth-guard'
import CarrierDashboardShell from '@/features/transport/CarrierDashboardShell'

export default function CarrierDashboardPage() {
  return (
    <AuthGuard>
      <CarrierDashboardShell />
    </AuthGuard>
  )
}
