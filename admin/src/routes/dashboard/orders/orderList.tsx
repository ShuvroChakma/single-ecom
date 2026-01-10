import { createFileRoute } from '@tanstack/react-router'
import OrderTable from '@/components/shared/pages/orders-table'


export const Route = createFileRoute('/dashboard/orders/orderList')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
   <OrderTable />
  </div>
}
