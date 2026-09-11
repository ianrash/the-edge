"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Calendar,
  LineChart,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettings } from "@/lib/settings-store";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "cn";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/import", label: "Import Trades", icon: FileSpreadsheet },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: LineChart },
];

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NowGreeting() {
  const { settings } = useSettings();
  const name = settings.displayName || "Trader";

  return (
    <div className="w-full flex-1">
      <h2 className="text-lg font-medium">
        {greetingFor(new Date())}, {name}.
      </h2>
      <p className="text-sm text-muted-foreground">Discipline today. Freedom tomorrow.</p>
    </div>
  );
}

export function NowAvatar() {
  const { settings } = useSettings();
  const name = settings.displayName || "Trader";

  return (
    <Avatar>
      {settings.email && (
        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00FFA3&color=05080D&bold=true`} />
      )}
      <AvatarFallback>{initialsFor(name)}</AvatarFallback>
    </Avatar>
  );
}

function NavList({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={cn("flex flex-col gap-2", className)}>
      {navLinks.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
              active
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <Image src="/logo.png" alt="The Edge Logo" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">THE EDGE</span>
      </div>
      <NavList className="mt-8 flex-1" />
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar border-r border-border px-4 py-6 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="The Edge Logo" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
                <span className="text-lg font-bold tracking-tight text-sidebar-foreground">THE EDGE</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList className="mt-8 flex-1" onNavigate={() => setOpen(false)} />
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}