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
import { Outlet, createFileRoute, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to login if not authenticated or not an admin after loading
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.user_type !== 'ADMIN'))) {
      navigate({ to: '/' })
    }
  }, [isLoading, isAuthenticated, user, navigate])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or not an admin
  if (!isAuthenticated || (user && user.user_type !== 'ADMIN')) {
    return null
  }

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
