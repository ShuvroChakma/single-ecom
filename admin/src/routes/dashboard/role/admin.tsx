import { createFileRoute } from '@tanstack/react-router'
import AdminTable from '@/components/shared/pages/admin-table'


export const Route = createFileRoute('/dashboard/role/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <AdminTable />
  </div>
}
