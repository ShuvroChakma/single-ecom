import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stores')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/stores"!</div>
}
