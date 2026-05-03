import { AuthGuard } from '@/components/auth-guard'
import CreateRequestWizard from '@/features/transport/CreateRequestWizard'

export default function NewTransportRequestPage() {
  return (
    <AuthGuard>
      <CreateRequestWizard />
    </AuthGuard>
  )
}
