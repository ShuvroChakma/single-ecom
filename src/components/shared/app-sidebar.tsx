

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  ListOrdered,
  Lock,
 
  Settings2,
  
  Store,
  User2,
} from "lucide-react"

import { NavMain } from "@/components/shared/nav-main"
import { NavProjects } from "@/components/shared/nav-projects"
import { NavUser } from "@/components/shared/nav-user"
import { TeamSwitcher } from "@/components/shared/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Naju Meah",
    email: "Najumeahjewellers@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Naju Meah",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
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
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
