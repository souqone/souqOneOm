import { AuthGuard } from '@/components/auth-guard'
import MyRequestsShell from '@/features/transport/MyRequestsShell'

export default function MyRequestsPage() {
  return (
    <AuthGuard>
      <MyRequestsShell />
    </AuthGuard>
  )
}
