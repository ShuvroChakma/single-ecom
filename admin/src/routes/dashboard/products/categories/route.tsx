import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/products/categories')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/products/categories"!</div>
}
