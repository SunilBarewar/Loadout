import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DesktopTopBar } from "@/components/desktop-top-bar";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CompactSessionHeader } from "@/components/compact-session-header";
import { ensureCurrentUser } from "@/features/users";
import { getUserMenuData } from "@/features/settings";
import { getActiveSessionForUser } from "@/features/sessions/repository";
import { toActiveSessionHeaderData } from "@/features/sessions/formatters";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureCurrentUser();
  const userMenuData = user ? await getUserMenuData(user.id) : null;
  const activeSession = user
    ? await getActiveSessionForUser(user.id)
    : null;
  const activeSessionHeaderData = activeSession
    ? toActiveSessionHeaderData(activeSession)
    : null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
        } as React.CSSProperties
      }
      className="h-svh w-full overflow-hidden bg-background text-foreground"
    >
      {/* 1. Fixed Left Sidebar on Desktop (> 900px) */}
      <AppSidebar activePlanTitle={userMenuData?.activePlanTitle ?? null} />

      {/* 2. Main Workspace / Content Column */}
      <div className="flex flex-1 flex-col min-w-0 h-svh overflow-hidden bg-background">
        {/* Desktop Top Bar (> 900px) */}
        <DesktopTopBar />

        {/* Mobile Top Bar (<= 900px) */}
        <MobileTopBar activePlanTitle={userMenuData?.activePlanTitle ?? null} />

        {/* Compact Session Header (only active during live workouts) */}
        <CompactSessionHeader activeSession={activeSessionHeaderData} />

        {/* Scrollable Page Content (independent scroll from sidebar) */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-background focus:outline-none max-[900px]:pb-20">
          {children}
        </main>

        {/* Mobile Bottom Navigation (<= 900px, hidden on active workout) */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
