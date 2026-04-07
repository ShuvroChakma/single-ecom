import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router'

import { getMe } from '@/api/auth'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { Separator } from '@/components/ui/separator'
import type { UserProfile } from '@/api/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    try {
      const response = await getMe()
      if (!response.success || !response.data) {
        throw redirect({ to: '/' })
      }
      if (response.data.user_type !== 'ADMIN') {
        throw redirect({ to: '/' })
      }
      return { user: response.data as UserProfile }
    } catch (e: unknown) {
      // Re-throw redirects, catch auth errors
      if (e && typeof e === 'object' && 'to' in e) throw e
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar className='' />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6 mt-1"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {location.pathname.split('/').filter(Boolean).slice(1).map((segment, index, array) => {
                  const path = `/dashboard/${array.slice(0, index + 1).join('/')}`
                  const label = segment
                    .replace(/-/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .replace(/\b\w/g, char => char.toUpperCase())

                  return (
                    <div key={path} className="flex items-center">
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem className="hidden md:block">
                        {index === array.length - 1 ? (
                          <span className="font-normal text-foreground">{label}</span>
                        ) : (
                          <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 ">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
