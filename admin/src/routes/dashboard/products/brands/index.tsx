import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/products/brands/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/products/brands/"!</div>
}
