import { createFileRoute } from '@tanstack/react-router'
import GeneralSettings from '@/components/shared/pages/general-settings'


export const Route = createFileRoute('/dashboard/settings/general')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <GeneralSettings />
  </div>
}
