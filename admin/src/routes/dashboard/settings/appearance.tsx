import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/appearance')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/settings/general' })
  },
  component: () => null,
})
