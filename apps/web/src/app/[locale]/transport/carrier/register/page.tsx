import { AuthGuard } from '@/components/auth-guard'
import CarrierRegisterShell from '@/features/transport/CarrierRegisterShell'

export default function CarrierRegisterPage() {
  return (
    <AuthGuard>
      <CarrierRegisterShell />
    </AuthGuard>
  )
}
