"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";

export function PlannerGreeting() {
  let firstName = "Lifter";

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clerkUser = useUser();
    if (clerkUser?.isLoaded && clerkUser.isSignedIn && clerkUser.user?.firstName) {
      firstName = clerkUser.user.firstName;
    }
  } catch {
    // Fallback if Clerk context is unavailable
  }

  const [greeting, setGreeting] = React.useState("Good evening");

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <div className="text-center space-y-1.5 select-none">
      <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-foreground leading-tight">
        {greeting}, {firstName}.
      </h1>
      <p className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-muted-foreground">
        What workout shall we build?
      </p>
    </div>
  );
}
