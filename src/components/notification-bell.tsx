"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CHECK_EVERY_MS = 15_000;

// The bell in the top bar. Every 15 seconds (and when you come back to
// the tab) it asks how many unread notifications you have. When the
// number goes up, it refreshes the page you're on, so a Deal Room or a
// conversation shows the other person's latest move without tapping
// Refresh.
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [serverCount, setServerCount] = useState(initialCount);
  const last = useRef(initialCount);

  // A fresh count from the server (after a refresh) replaces ours.
  // React's recommended way to follow a changing prop: compare during
  // render instead of in an effect.
  if (initialCount !== serverCount) {
    setServerCount(initialCount);
    setCount(initialCount);
  }
  useEffect(() => {
    last.current = initialCount;
  }, [initialCount]);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      if (document.visibilityState !== "visible") return;
      // RLS only counts your own notifications.
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (unread === null) return;
      if (unread > last.current) router.refresh();
      last.current = unread;
      setCount(unread);
    }

    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return (
    <Link
      href="/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
