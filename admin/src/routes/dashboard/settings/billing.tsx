import { createFileRoute } from '@tanstack/react-router'
import BillingSettings from '@/components/shared/pages/billing-settings'


export const Route = createFileRoute('/dashboard/settings/billing')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <BillingSettings />
  </div>
}
