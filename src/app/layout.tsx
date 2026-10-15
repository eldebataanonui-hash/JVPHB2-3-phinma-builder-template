import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { AboutLink, MobileNav, SideNav } from "@/components/app-shell/nav-links";
import { TopBar } from "@/components/app-shell/top-bar";
import { createClient } from "@/lib/supabase/server";

// Inter for reading (very clear on screens), Rajdhani for headings (a
// squared, esports-style font that fits a gaming marketplace). Next.js
// downloads them at build time, so no extra service is involved.
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const heading = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "AQTech GHub",
  description: "Safe, step-by-step Mobile Legends account trades",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = Boolean(user);

  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TopBar />
        <div className="flex flex-1">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-border md:flex">
            <SideNav loggedIn={loggedIn} myId={user?.id} />
            {/* mt-auto pushes About us to the bottom-left corner. */}
            <div className="mt-auto p-3">
              <AboutLink />
            </div>
          </aside>
          {/* pb-20 on phones leaves room for the bottom tab bar. */}
          <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">{children}</div>
        </div>
        <MobileNav loggedIn={loggedIn} myId={user?.id} />
      </body>
    </html>
  );
}
