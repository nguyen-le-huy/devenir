import * as React from "react"
import { Link } from "react-router-dom"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import { useInventoryAlerts } from "@/hooks/useInventory"
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
  IconShare,
} from "@tabler/icons-react"
import { ChevronRight } from "lucide-react"

import { NavUser } from "./navigation/NavUser"
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
          title: "Colors",
          url: "/admin/colors",
          icon: IconTag,
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
          ],
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
        {
          title: "Social Posts",
          url: "/admin/social-posts",
          icon: IconShare,
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

  const getItemKey = (groupName: string, itemTitle: string) => `${groupName}::${itemTitle}`
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    const saved = localStorage.getItem('sidebar-expanded-items')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set()
      }
    }
    // Keep the most-used sections expanded by default to mirror previous UX
    return new Set([
      getItemKey('Sales & Orders Management', 'Orders'),
      getItemKey('Product Management', 'Products'),
      getItemKey('Product Management', 'Inventory'),
    ])
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

  const toggleItem = (groupName: string, itemTitle: string) => {
    const key = getItemKey(groupName, itemTitle)
    const next = new Set(expandedItems)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setExpandedItems(next)
    localStorage.setItem('sidebar-expanded-items', JSON.stringify(Array.from(next)))
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

  const { data: alertData } = useInventoryAlerts()
  const inventoryAlertBadge = React.useMemo(() => {
    const low = alertData?.lowStock?.length ?? 0
    const out = alertData?.outOfStock?.length ?? 0
    const over = alertData?.overstock?.length ?? 0
    const reservation = alertData?.reservationIssues?.length ?? 0
    const total = low + out + over + reservation

    if (!total) {
      return { total: 0, className: "bg-muted text-muted-foreground" }
    }

    if (out > 0) {
      return { total, className: "bg-destructive text-destructive-foreground" }
    }

    if (low > 0 || reservation > 0) {
      return { total, className: "bg-amber-500 text-white" }
    }

    return { total, className: "bg-sky-500 text-white" }
  }, [alertData])

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
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full text-sm">
                  {section.group}
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item: any) =>
                      item.items ? (
                        <Collapsible
                          key={item.title}
                          open={expandedItems.has(getItemKey(section.group, item.title))}
                          onOpenChange={() => toggleItem(section.group, item.title)}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.title}>
                                <item.icon />
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((subItem: any) => {
                                  const isStockAlertsLink = subItem.url === "/admin/inventory/alerts"
                                  const badgeValue = isStockAlertsLink ? inventoryAlertBadge.total : subItem.badge
                                  const badgeClassName = isStockAlertsLink
                                    ? inventoryAlertBadge.className
                                    : "bg-destructive text-destructive-foreground"

                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton asChild>
                                        <Link to={subItem.url}>
                                          <span>{subItem.title}</span>
                                          {badgeValue ? (
                                            <span
                                              className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${badgeClassName}`}
                                            >
                                              {badgeValue}
                                            </span>
                                          ) : null}
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  )
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton size="lg" asChild tooltip={item.title}>
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
