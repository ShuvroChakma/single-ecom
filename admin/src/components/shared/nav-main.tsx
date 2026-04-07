
import { Link, useRouterState } from "@tanstack/react-router"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Check if a URL is active (exact match or starts with for nested routes)
  const isUrlActive = (url: string, exact = false) => {
    if (url === "#") return false
    if (exact) return currentPath === url
    // For parent items, check if current path starts with the URL
    return currentPath === url || currentPath.startsWith(url + "/")
  }

  // Check if any sub-item is active
  const hasActiveSubItem = (subItems?: { url: string }[]) => {
    if (!subItems) return false
    return subItems.some((sub) => isUrlActive(sub.url))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isItemActive = item.items
            ? hasActiveSubItem(item.items)
            : isUrlActive(item.url, item.url === "/dashboard")

          return (
            <SidebarMenuItem key={item.title}>
              {item.items && item.items.length > 0 ? (
                <Collapsible
                  asChild
                  defaultOpen={isItemActive}
                  className="group/collapsible"
                >
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isItemActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isUrlActive(subItem.url)}>
                              <Link to={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ) : (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isItemActive}
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
