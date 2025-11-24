import * as React from "react"
import { Link } from "react-router-dom"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import {
  IconDashboard,
  IconShoppingCart,
  IconPackage,
  IconUsers,
  IconFileText,
  IconCreditCard,
  IconBox,
  IconTag,
  IconBarcode,
  IconUserCheck,
  IconUsersGroup,
  IconMessage,
  IconClipboardList,
  IconTruck,
  IconRotateClockwise,
  IconGift,
  IconMail,
  IconHeartHandshake,
  IconChartBar,
  IconFileDownload,
  IconBrain,
  IconReceipt,
  IconCash,
  IconHistory,
  IconDatabase,
  IconSettingsCog,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const data = {
  user: {
    name: "Admin User",
    email: "admin@devenir.shop",
    avatar: "/avatars/admin.jpg",
  },
  navigation: [
    // Dashboard & Overview
    {
      group: "Dashboard & Overview",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: IconDashboard,
          badge: null,
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
          icon: IconChartBar,
          badge: null,
        },
      ],
    },
    // Sales & Orders Management
    {
      group: "Sales & Orders Management",
      items: [
        {
          title: "Orders",
          url: "/admin/orders",
          icon: IconShoppingCart,
          badge: null,
          items: [
            {
              title: "All Orders",
              url: "/admin/orders",
            },
            {
              title: "Pending Orders",
              url: "/admin/orders?status=pending",
              badge: 12,
            },
            {
              title: "Paid Orders",
              url: "/admin/orders?status=paid",
            },
            {
              title: "Shipped",
              url: "/admin/orders?status=shipped",
            },
          ],
        },
        {
          title: "Shipments",
          url: "/admin/shipments",
          icon: IconTruck,
          badge: null,
        },
        {
          title: "Returns & Refunds",
          url: "/admin/returns",
          icon: IconRotateClockwise,
          badge: null,
        },
      ],
    },
    // Product Management
    {
      group: "Product Management",
      items: [
        {
          title: "Products",
          url: "/admin/products",
          icon: IconPackage,
          badge: null,
          items: [
            {
              title: "All Products",
              url: "/admin/products",
            },
            {
              title: "Add New Product",
              url: "/admin/products/new",
            },
          ],
        },
        {
          title: "Variants & SKUs",
          url: "/admin/variants",
          icon: IconBarcode,
          badge: null,
        },
        {
          title: "Categories",
          url: "/admin/categories",
          icon: IconTag,
          badge: null,
        },
        {
          title: "Brands",
          url: "/admin/brands",
          icon: IconBox,
          badge: null,
        },
        {
          title: "Inventory",
          url: "/admin/inventory",
          icon: IconDatabase,
          badge: null,
          items: [
            {
              title: "Stock Overview",
              url: "/admin/inventory",
            },
            {
              title: "Stock Alerts",
              url: "/admin/inventory/alerts",
              badge: 5,
            },
          ],
        },
      ],
    },
    // Customer Management
    {
      group: "Customer Management",
      items: [
        {
          title: "Customers",
          url: "/admin/customers",
          icon: IconUsers,
          badge: null,
          items: [
            {
              title: "All Customers",
              url: "/admin/customers",
            },
            {
              title: "VIP Customers",
              url: "/admin/customers?segment=vip",
            },
          ],
        },
        {
          title: "Customer Groups",
          url: "/admin/customer-groups",
          icon: IconUsersGroup,
          badge: null,
        },
        {
          title: "Reviews",
          url: "/admin/reviews",
          icon: IconMessage,
          badge: null,
        },
      ],
    },
    // Marketing & Promotions
    {
      group: "Marketing & Promotions",
      items: [
        {
          title: "Promotions",
          url: "/admin/promotions",
          icon: IconGift,
          badge: null,
          items: [
            {
              title: "All Promotions",
              url: "/admin/promotions",
            },
            {
              title: "Create Promotion",
              url: "/admin/promotions/new",
            },
          ],
        },
        {
          title: "Email Campaigns",
          url: "/admin/campaigns",
          icon: IconMail,
          badge: null,
        },
        {
          title: "Loyalty Programs",
          url: "/admin/loyalty",
          icon: IconHeartHandshake,
          badge: null,
        },
      ],
    },
    // Content Management
    {
      group: "Content Management",
      items: [
        {
          title: "Media Library",
          url: "/admin/media",
          icon: IconFileText,
          badge: null,
        },
        {
          title: "Pages",
          url: "/admin/pages",
          icon: IconClipboardList,
          badge: null,
        },
        {
          title: "Blog/News",
          url: "/admin/blog",
          icon: IconFileDownload,
          badge: null,
        },
      ],
    },
    // AI & Automation
    {
      group: "AI & Automation",
      items: [
        {
          title: "AI Chatbot",
          url: "/admin/chatbot",
          icon: IconBrain,
          badge: null,
        },
        {
          title: "Virtual Try-On",
          url: "/admin/try-on",
          icon: IconBrain,
          badge: null,
        },
      ],
    },
    // Financial Management
    {
      group: "Financial Management",
      items: [
        {
          title: "Revenue Reports",
          url: "/admin/reports/revenue",
          icon: IconReceipt,
          badge: null,
        },
        {
          title: "Payment Methods",
          url: "/admin/payment-methods",
          icon: IconCreditCard,
          badge: null,
        },
        {
          title: "Transactions",
          url: "/admin/transactions",
          icon: IconCash,
          badge: null,
        },
      ],
    },
    // System & Settings
    {
      group: "System & Settings",
      items: [
        {
          title: "Users & Roles",
          url: "/admin/users",
          icon: IconUserCheck,
          badge: null,
        },
        {
          title: "Audit Logs",
          url: "/admin/audit-logs",
          icon: IconHistory,
          badge: null,
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: IconSettingsCog,
          badge: null,
          items: [
            {
              title: "General Settings",
              url: "/admin/settings/general",
            },
            {
              title: "Payment Configuration",
              url: "/admin/settings/payment",
            },
            {
              title: "Email Settings",
              url: "/admin/settings/email",
            },
            {
              title: "Integrations",
              url: "/admin/settings/integrations",
            },
          ],
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAdminAuth()
  const [_expandedGroups, _setExpandedGroups] = React.useState<Set<string>>(
    new Set(["Dashboard & Overview", "Sales & Orders Management"])
  )
  const [userData, setUserData] = React.useState<any>(null)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('sidebar-expanded-groups')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set(['Dashboard & Overview'])
      }
    }
    return new Set(['Dashboard & Overview'])
  })

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
    // Persist to localStorage
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(Array.from(newExpanded)))
  }

  // Get user data from context
  const getUserData = () => {
    if (user) {
      return {
        name: user.username || user.email || "Admin User",
        email: user.email || "admin@devenir.shop",
        avatar: "/avatars/admin.jpg",
      }
    }
    
    // Default user data
    return {
      name: "Admin User",
      email: "admin@devenir.shop",
      avatar: "/avatars/admin.jpg",
    }
  }

  // Update userData when user context changes
  React.useEffect(() => {
    setUserData(getUserData())
  }, [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/admin">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconPackage className="size-5!" />
                </div>
                <span className="text-base font-bold">Devenir</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {data.navigation.map((section) => (
          <Collapsible
            key={section.group}
            open={expandedGroups.has(section.group)}
            onOpenChange={() => toggleGroup(section.group)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-primary/10 transition-colors duration-200 font-bold text-sm px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:border-primary/40">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-primary dark:text-primary-foreground font-bold tracking-wide">
                      {section.group}
                    </span>
                    <span className="text-xs opacity-60 group-data-[state=open]/collapsible:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item: any) =>
                      item.items ? (
                        <Collapsible key={item.title} defaultOpen={true} asChild>
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                                <item.icon />
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                                    {item.badge}
                                  </span>
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((subItem: any) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <Link to={subItem.url}>
                                        <span>{subItem.title}</span>
                                        {'badge' in subItem && subItem.badge ? (
                                          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                                            {subItem.badge}
                                          </span>
                                        ) : null}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <Link to={item.url}>
                              <item.icon />
                              <span>{item.title}</span>
                              {'badge' in item && item.badge ? (
                                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                                  {item.badge}
                                </span>
                              ) : null}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
