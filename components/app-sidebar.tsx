"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Bot,
  Layers,
  History,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";
import { cn } from "cn";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  {
    title: "Today",
    href: "/today",
    icon: CalendarDays,
  },
  {
    title: "Planner",
    href: "/planner",
    icon: Bot,
  },
  {
    title: "My plans",
    href: "/plans",
    icon: Layers,
  },
  {
    title: "History",
    href: "/history",
    icon: History,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

type AppSidebarProps = {
  activePlanTitle?: string | null;
};

export function AppSidebar({ activePlanTitle = null }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="none"
      className="hidden min-[901px]:flex h-svh w-64 flex-col border-r border-border bg-card text-card-foreground shrink-0 select-none"
    >
      {/* Brand Header */}
      <SidebarHeader className="h-16 flex items-center justify-between px-5 border-b border-border">
        <Link href="/today" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <span className="font-display font-extrabold text-2xl tracking-wider text-foreground">
            LOADOUT<span className="text-primary">.AI</span>
          </span>
        </Link>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/today" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-primary! text-primary-foreground! font-semibold hover:bg-primary/50! hover:text-primary-foreground! shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-border my-2" />

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-primary! text-primary-foreground! font-semibold hover:bg-primary! hover:text-primary-foreground! shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Menu at Bottom */}
      <SidebarFooter className="p-3 border-t border-border bg-card">
        <UserMenu variant="sidebar" activePlanTitle={activePlanTitle} />
      </SidebarFooter>
    </Sidebar>
  );
}
