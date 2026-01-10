import { createFileRoute } from '@tanstack/react-router'
import AdminDashboard from '@/components/shared/pages/dashboard'


export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <AdminDashboard />
  </div>
}
