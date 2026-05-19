"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Flag,
  Mail,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/items", label: "Items", icon: Package },
  { href: "/admin/flags", label: "Flags", icon: Flag },
  { href: "/admin/banned-emails", label: "Blocked", icon: Mail },
  { href: "/admin/conversations", label: "Chats", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      {/* Horizontal scrollable tab bar */}
      <div className="sticky top-0 z-10 border-b border-border-default bg-bg-base/95 backdrop-blur-md">
        <div className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-500/10 text-brand-500 dark:text-brand-400"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-base"
                )}
              >
                <Icon size={12} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
