

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  BotIcon,
  Command,
  Frame,
  GalleryVerticalEnd,
  ListOrdered,
  Lock,
  Map,
  PieChart,
  Settings2,
  Settings2Icon,
  SquareTerminal,
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
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
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
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
