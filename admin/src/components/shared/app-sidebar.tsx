import {
  CreditCard,
  GalleryVerticalEnd,
  Gift,
  Home,
  Package,
  Settings2,
  Shield,
  ShoppingCart,
  Truck,
  Users
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
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true, // Keep active to visually indicate we start here, or remove if dynamic
    },
    {
      title: "Products",
      url: "#",
      icon: Package,
      items: [
        {
          title: "All Products",
          url: "/dashboard/products",
        },
        {
          title: "Categories",
          url: "/dashboard/products/categories",
        },
        {
          title: "Brands",
          url: "/dashboard/products/brands",
        },
        {
          title: "Collections",
          url: "/dashboard/products/collections",
        },
        {
          title: "Attributes",
          url: "/dashboard/products/attributes",
        },
        {
          title: "Metals",
          url: "/dashboard/products/metals",
        },
      ],
    },
    {
      title: "Orders",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "All Orders",
          url: "/dashboard/orders",
        },
        {
          title: "POS",
          url: "/dashboard/orders/pos",
        },
      ],
    },
    {
      title: "Customers",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Customers",
          url: "/dashboard/customers",
        },
      ],
    },
    {
      title: "Marketing",
      url: "#",
      icon: Gift,
      items: [
        {
          title: "Promo Codes",
          url: "/dashboard/marketing/promo-codes",
        },
        {
          title: "Slides",
          url: "/dashboard/marketing/slides",
        },
      ],
    },
    {
      title: "Delivery",
      url: "#",
      icon: Truck,
      items: [
        {
          title: "Delivery Zones",
          url: "/dashboard/delivery/zones",
        },
      ],
    },
    {
      title: "Payments",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Payment Gateways",
          url: "/dashboard/payments/gateways",
        },
      ],
    },
    {
      title: "Roles & Permissions",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "Roles",
          url: "/dashboard/roles",
        },
        {
          title: "Admins",
          url: "/dashboard/admins",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Store Info",
          url: "/dashboard/settings/store",
        },
        {
          title: "Appearance",
          url: "/dashboard/settings/appearance",
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
