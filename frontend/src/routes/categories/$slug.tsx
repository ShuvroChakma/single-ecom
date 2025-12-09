import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/categories/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/categories/$slug"!</div>
}
