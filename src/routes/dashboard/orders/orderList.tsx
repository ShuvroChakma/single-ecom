import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/orders/orderList')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    order list
  </div>
}
