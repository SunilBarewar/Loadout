"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronsUpDown, Shield } from "lucide-react";

interface UserMenuProps {
  variant?: "sidebar" | "compact";
}

export function UserMenu({ variant = "sidebar" }: UserMenuProps) {
  const router = useRouter();

  // Safely access Clerk user details if configured
  let user: {
    fullName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  } | null = null;

  let signOutFn = () => {
    router.push("/sign-in");
  };

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clerkUser = useUser();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clerk = useClerk();

    if (clerkUser.isLoaded && clerkUser.isSignedIn && clerkUser.user) {
      user = {
        fullName: clerkUser.user.fullName || clerkUser.user.firstName || "Lifter",
        email: clerkUser.user.primaryEmailAddress?.emailAddress || "lifter@loadout.ai",
        imageUrl: clerkUser.user.imageUrl,
      };
      signOutFn = () => {
        clerk.signOut({ redirectUrl: "/sign-in" });
      };
    }
  } catch {
    // Fallback if Clerk context is unavailable
  }

  const displayName = user?.fullName || "Lifter";
  const displayEmail = user?.email || "alex@loadout.ai";
  const avatarUrl = user?.imageUrl || "";

  // Compute initials (e.g. "LO" or "AL")
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "LO";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          variant === "sidebar"
            ? "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
      >
        <Avatar className="size-8 rounded-full border border-border">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-surface-2 text-xs font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        {variant === "sidebar" && (
          <>
            <div className="flex flex-1 flex-col min-w-0 text-left">
              <span className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={variant === "sidebar" ? "top" : "bottom"}
        align={variant === "sidebar" ? "start" : "end"}
        className="w-64 rounded-md border border-border bg-card p-1.5 shadow-2xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2">
            <div className="text-sm font-bold text-foreground">{displayName}</div>
            <div className="truncate text-xs text-muted-foreground">{displayEmail}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>Active: Hypertrophy 4-Day</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border my-1" />

        <DropdownMenuItem
          render={<Link href="/settings" className="flex w-full items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-sm text-sm text-foreground hover:bg-surface-2 transition-colors" />}
        >
          <Settings className="size-4 text-muted-foreground" />
          <span>Settings & Preferences</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<Link href="/settings" className="flex w-full items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-sm text-sm text-foreground hover:bg-surface-2 transition-colors" />}
        >
          <Shield className="size-4 text-muted-foreground" />
          <span>Equipment & Units</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border my-1" />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOutFn()}
          className="flex w-full items-center gap-2.5 cursor-pointer px-2.5 py-2 rounded-sm text-sm text-destructive hover:bg-destructive/10 transition-colors focus:bg-destructive/15 focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
