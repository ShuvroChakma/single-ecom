import {
  GalleryVerticalEnd,
  Gift,
  Home,
  MessageSquare,
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
import { P } from "@/lib/permissions"
import { getRouteApi } from "@tanstack/react-router"

const dashboardRoute = getRouteApi('/dashboard')

type NavItem = {
  title: string
  url: string
  icon?: React.ComponentType
  permission?: string
  items?: { title: string; url: string; permission?: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Products",
    url: "#",
    icon: Package,
    permission: P.PRODUCTS_READ,
    items: [
      { title: "All Products", url: "/dashboard/products", permission: P.PRODUCTS_READ },
      { title: "Categories", url: "/dashboard/products/categories", permission: P.CATEGORIES_READ },
      { title: "Brands", url: "/dashboard/products/brands", permission: P.BRANDS_READ },
      { title: "Collections", url: "/dashboard/products/collections", permission: P.COLLECTIONS_READ },
      { title: "Attributes", url: "/dashboard/catalog/attributes", permission: P.ATTRIBUTES_READ },
      { title: "Metals", url: "/dashboard/products/metals", permission: P.METALS_READ },
      { title: "Rates", url: "/dashboard/products/rates", permission: P.RATES_READ },
    ],
  },
  {
    title: "Orders",
    url: "#",
    icon: ShoppingCart,
    permission: P.ORDERS_READ,
    items: [
      { title: "All Orders", url: "/dashboard/orders", permission: P.ORDERS_READ },
      { title: "POS", url: "/dashboard/orders/pos", permission: P.ORDERS_WRITE },
    ],
  },
  {
    title: "Customers",
    url: "#",
    icon: Users,
    permission: P.USERS_READ,
    items: [
      { title: "All Customers", url: "/dashboard/users/customers", permission: P.USERS_READ },
    ],
  },
  {
    title: "Marketing",
    url: "#",
    icon: Gift,
    permission: P.SLIDES_READ,
    items: [
      { title: "Promo Codes", url: "/dashboard/marketing/promo-codes", permission: P.SLIDES_READ },
      { title: "Slides", url: "/dashboard/marketing/slides", permission: P.SLIDES_READ },
    ],
  },
  {
    title: "Inquiries",
    url: "/dashboard/inquiries",
    icon: MessageSquare,
    permission: P.INQUIRIES_READ,
  },
  {
    title: "Delivery",
    url: "#",
    icon: Truck,
    permission: P.SETTINGS_READ,
    items: [
      { title: "Delivery Zones", url: "/dashboard/delivery/zones", permission: P.SETTINGS_READ },
    ],
  },
  {
    title: "Roles & Permissions",
    url: "#",
    icon: Shield,
    permission: P.ROLES_READ,
    items: [
      { title: "Roles", url: "/dashboard/roles", permission: P.ROLES_READ },
      { title: "Admins", url: "/dashboard/users/admins", permission: P.ADMINS_MANAGE },
    ],
  },
  {
    title: "Settings",
    url: "/dashboard/settings/general",
    icon: Settings2,
    permission: P.SETTINGS_READ,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = dashboardRoute.useRouteContext()
  const isSuperAdmin = user?.permissions?.includes("*") ?? false

  const canSee = (permission?: string) =>
    !permission || isSuperAdmin || (user?.permissions?.includes(permission) ?? false)

  const filteredNav = NAV_ITEMS
    .filter((item) => canSee(item.permission))
    .map((item) => ({
      ...item,
      items: item.items?.filter((sub) => canSee(sub.permission)),
    }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={[{ name: "Admin Panel", logo: GalleryVerticalEnd, plan: "E-commerce" }]} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
