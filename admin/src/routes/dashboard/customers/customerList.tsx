import { createFileRoute } from '@tanstack/react-router'
import UserTable from '@/components/shared/pages/user-table'


export const Route = createFileRoute('/dashboard/customers/customerList')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <UserTable />
  </div>
}
