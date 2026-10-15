"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  MessageCircle,
  PlusCircle,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Every function of the app, in one place. The sidebar (desktop) and
// the bottom tab bar (phones) both use this list.
const LOGGED_IN = [
  { href: "/", label: "Home", icon: Home },
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/deals/new", label: "New Deal", icon: PlusCircle },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/traders", label: "Find traders", icon: Search },
  { href: "/rules", label: "Trading Rules", icon: BookOpen },
];

const LOGGED_OUT = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rules", label: "Trading Rules", icon: BookOpen },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // My profile also covers /profile/<id> and Deal Rooms you open from it.
  if (href === "/profile") return pathname.startsWith("/profile");
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Left sidebar, shown on tablets and computers.
export function SideNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const items = loggedIn ? LOGGED_IN : LOGGED_OUT;

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, href)
              ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Icon className={cn("h-4 w-4", isActive(pathname, href) && "text-primary")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// Bottom tab bar, shown on phones instead of the sidebar.
export function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  // Trading Rules is in the sidebar but left off the phone bar to keep
  // the tabs big enough to tap; it's linked from Home and every Deal Room.
  const items = (loggedIn ? LOGGED_IN : LOGGED_OUT).filter(
    (item) => !loggedIn || item.href !== "/rules",
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
    >
      <ul className="flex">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                isActive(pathname, href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
