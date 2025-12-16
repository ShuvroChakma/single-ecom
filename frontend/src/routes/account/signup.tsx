import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/account/signup"!</div>
}
