import { AuthGuard } from '@/components/auth-guard'
import MyQuotesShell from '@/features/transport/MyQuotesShell'

export default function MyQuotesPage() {
  return (
    <AuthGuard>
      <MyQuotesShell />
    </AuthGuard>
  )
}
