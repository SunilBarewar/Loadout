"use client";

import * as React from "react";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export function MobileTopBar() {
  return (
    <header className="flex min-[901px]:hidden h-14 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4 shrink-0 select-none z-30">
      {/* Brand */}
      <Link href="/today" className="flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
        <span className="font-display font-extrabold text-xl tracking-wider text-foreground">
          LOADOUT<span className="text-primary">.AI</span>
        </span>
      </Link>

      {/* Profile menu on the right */}
      <div className="flex items-center gap-2">
        <UserMenu variant="compact" />
      </div>
    </header>
  );
}
