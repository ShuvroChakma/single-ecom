import {
  GalleryVerticalEnd,
  ListOrdered,
  Lock,
  Settings2,
  Store,
  User2,
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/shared/nav-main"
import { NavUser } from "@/components/shared/nav-user"
import { TeamSwitcher } from "@/components/shared/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation data
const data = {
  teams: [
    {
      name: "Admin Panel",
      logo: GalleryVerticalEnd,
      plan: "E-commerce",
    },
  ],
  navMain: [
    {
      title: "Role",
      url: "#",
      icon: Lock,
      isActive: true,
      items: [
        {
          title: "Admin",
          url: "/dashboard/role/admin",
        },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Store,
      isActive: true,
      items: [
        {
          title: "Product list",
          url: "/dashboard/products/productList",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ListOrdered,
      isActive: true,
      items: [
        {
          title: "All orders",
          url: "/dashboard/orders/orderList",
        },
      ],
    },
    {
      title: "Customers",
      url: "#",
      icon: User2,
      isActive: true,
      items: [
        {
          title: "Customer list",
          url: "/dashboard/customers/customerList",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
