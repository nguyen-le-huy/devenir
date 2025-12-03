import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAdminAuth } from "@/contexts/AdminAuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconBell,
  IconPlus,
  IconSearch,
  IconMoon,
  IconSun,
  IconLanguage,
  IconLogout,
  IconSettings,
  IconUser,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useLocale } from "@/contexts/LocaleContext"

export function SiteHeader() {
  const { user, logout } = useAdminAuth()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const { locale, setLocale } = useLocale()
  
  // Get display name and email
  const displayName = user?.username || user?.email?.split('@')[0] || 'Admin'
  const displayEmail = user?.email || 'admin@devenir.shop'
  const initials = displayName.substring(0, 1).toUpperCase()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear" style={{ height: 'var(--header-height)' }}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Left: Sidebar Toggle */}
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4"
        />

        {/* Center: Smart Search Bar */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders, products, customers..."
              className="pl-10 pr-4 w-full rounded-lg bg-muted/50"
            />
          </div>
        </div>

        {/* Right: Notifications, Quick Actions, Theme, Language, User */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
              >
                <IconBell className="h-5 w-5" />
                {/* Notification Badge */}
                <span className="absolute right-0 top-0 flex h-2 w-2 items-center justify-center rounded-full bg-destructive"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">New Order #12345</span>
                  <span className="text-xs text-muted-foreground">2 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">Low Stock Alert</span>
                  <span className="text-xs text-muted-foreground">White T-Shirt (L)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm">New Product Review</span>
                  <span className="text-xs text-muted-foreground">5 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                <Button variant="outline" size="sm" className="w-full">View All</Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
              >
                <IconPlus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href="/admin/products/new" className="w-full">New Product</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/admin/orders/new" className="w-full">New Order</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/admin/promotions/new" className="w-full">New Promotion</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/admin/campaigns/new" className="w-full">New Campaign</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? (
              <IconSun className="h-5 w-5" />
            ) : (
              <IconMoon className="h-5 w-5" />
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <IconLanguage className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setLocale("vi")
                }}
              >
                <span className="mr-2">{locale === "vi" ? "✓" : ""}</span>🇻🇳 Tiếng Việt
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setLocale("en")
                }}
              >
                <span className="mr-2">{locale === "en" ? "✓" : ""}</span>🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 pl-3 pr-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </div>
                <span className="hidden sm:inline-block text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span>{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">{displayEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <IconUser className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconSettings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
