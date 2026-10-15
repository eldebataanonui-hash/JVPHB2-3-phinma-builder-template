"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Crown,
  Home,
  KeyRound,
  MessageCircle,
  PlusCircle,
  Search,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Every function of the app, in one place. The sidebar (desktop) and
// the bottom tab bar (phones) both use this list.
const LOGGED_IN = [
  { href: "/", label: "Home", icon: Home },
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/deals/new", label: "New Deal", icon: PlusCircle },
  { href: "/deals/join", label: "Join a deal", icon: KeyRound },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/traders", label: "Find traders", icon: Search },
  { href: "/rules", label: "Trading Rules", icon: BookOpen },
  { href: "/pricing", label: "Plans", icon: Crown },
];

const LOGGED_OUT = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rules", label: "Trading Rules", icon: BookOpen },
  { href: "/pricing", label: "Plans", icon: Crown },
];

function isActive(pathname: string, href: string, myId?: string) {
  if (href === "/") return pathname === "/";
  // My profile: only your own, not someone else's profile.
  if (href === "/profile") return pathname === "/profile" || pathname === `/profile/${myId}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Left sidebar, shown on tablets and computers.
export function SideNav({ loggedIn, myId }: { loggedIn: boolean; myId?: string }) {
  const pathname = usePathname();
  const items = loggedIn ? LOGGED_IN : LOGGED_OUT;

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href, myId) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, href, myId)
              ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Icon className={cn("h-4 w-4", isActive(pathname, href, myId) && "text-primary")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

// "About us", pinned to the bottom-left corner of the sidebar.
export function AboutLink() {
  const pathname = usePathname();
  const active = pathname === "/about";

  return (
    <Link
      href="/about"
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2 transition-colors",
        active
          ? "border-primary/40 bg-primary/15"
          : "border-border hover:bg-secondary",
      )}
    >
      <Logo size="sm" showName={false} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">About us</span>
        <span className="text-xs text-muted-foreground">Who we are and why</span>
      </span>
    </Link>
  );
}

// Bottom tab bar, shown on phones instead of the sidebar.
export function MobileNav({ loggedIn, myId }: { loggedIn: boolean; myId?: string }) {
  const pathname = usePathname();
  // Trading Rules and Join a deal are in the sidebar but left off the
  // phone bar to keep the tabs big enough to tap. Join a deal is on Home
  // and in every Messages conversation; the Rules are on Home and in
  // every Deal Room.
  const items = (loggedIn ? LOGGED_IN : LOGGED_OUT).filter(
    (item) => !loggedIn || !["/rules", "/deals/join", "/pricing"].includes(item.href),
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
              aria-current={isActive(pathname, href, myId) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                isActive(pathname, href, myId) ? "text-primary" : "text-muted-foreground",
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
