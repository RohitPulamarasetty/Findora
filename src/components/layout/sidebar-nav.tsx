"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  MessageCircle,
  User,
  CheckCircle2,
  Settings,
  Shield,
  LogOut,
  Info,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FindoraLogo } from "@/components/shared/findora-logo";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useNavTransition } from "@/hooks/use-nav-transition";

const PRIMARY_NAV = [
  { label: "Home", href: "/home", Icon: Home },
  { label: "Report Item", href: "/report", Icon: PlusCircle },
  { label: "Messages", href: "/messages", Icon: MessageCircle },
  { label: "Profile", href: "/profile", Icon: User },
] as const;

const SECONDARY_NAV = [
  { label: "Completed", href: "/cases/completed", Icon: CheckCircle2 },
  { label: "Settings", href: "/settings", Icon: Settings },
] as const;

const SUPPORT_NAV = [
  { label: "About", href: "/about", Icon: Info },
  { label: "Contact & Support", href: "/contact", Icon: LifeBuoy },
] as const;

interface SidebarNavProps {
  isAdmin?: boolean;
  user?: { full_name: string; avatar_url: string | null };
}

function NavItem({
  href,
  label,
  Icon,
  isActive,
  badge,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  badge?: number;
}) {
  const { isPending, pendingHref, linkProps } = useNavTransition();
  const isPendingTarget = isPending && pendingHref === href;
  const showActive = isActive || isPendingTarget;
  return (
    <Link
      href={href}
      {...linkProps(href)}
      aria-current={showActive ? "page" : undefined}
      className={cn(
        "ease-[cubic-bezier(0.16,1,0.3,1)] group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200",
        showActive
          ? "text-brand-500 dark:text-brand-400"
          : "text-text-muted-fg hover:bg-bg-muted-surface/70 hover:text-text-base"
      )}
    >
      {showActive && (
        <motion.span
          layoutId="sidebar-pill"
          className="absolute inset-0 rounded-xl border border-brand-500/20 bg-gradient-to-r from-brand-500/15 via-brand-500/10 to-accentc-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_rgb(var(--color-brand-500)/0.18)] dark:border-brand-400/25"
          transition={{ type: "spring", stiffness: 500, damping: 42 }}
        />
      )}
      <span
        className={cn(
          "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          showActive
            ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_4px_12px_rgb(var(--color-brand-500)/0.45)]"
            : "text-text-muted-fg group-hover:bg-bg-muted-surface group-hover:text-text-base"
        )}
      >
        <Icon size={15} aria-hidden="true" strokeWidth={showActive ? 2.5 : 2} />
      </span>
      <span className="relative z-10 flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="relative z-10 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accentc-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_8px_rgb(var(--color-brand-500)/0.5)]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0.5">{children}</div>;
}

function NavDivider() {
  return (
    <div className="my-2 px-3">
      <div className="h-px bg-border-default/50" />
    </div>
  );
}

function NavSectionLabel({ label }: { label: string }) {
  return (
    <p className="mb-1 mt-0.5 px-3 text-[9.5px] font-bold uppercase tracking-[0.13em] text-text-muted-fg/70">
      {label}
    </p>
  );
}

export function SidebarNav({ isAdmin, user }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unreadMessages = useAppStore((s) => s.unreadMessages);

  function isActive(href: string) {
    return pathname === href || (href !== "/home" && pathname.startsWith(href));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      aria-label="Sidebar navigation"
      className="fixed left-0 top-0 z-30 hidden h-full w-sidebar flex-col overflow-hidden border-r border-border-default bg-bg-subtle/80 backdrop-blur-xl md:flex"
    >
      {/* Ambient gradient wash inside the sidebar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 0% 0%, rgb(var(--color-brand-500) / 0.10), transparent 70%), radial-gradient(ellipse 70% 35% at 100% 100%, rgb(var(--color-accent-500) / 0.07), transparent 70%)",
        }}
      />

      {/* ── Wordmark ─────────────────────────────────────────────── */}
      <div className="relative flex h-[60px] shrink-0 items-center border-b border-border-default/60 px-4">
        <Link
          href="/home"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] shadow-[0_4px_14px_rgb(var(--color-brand-500)/0.30)] ring-1 ring-brand-500/25">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-accentc-600" />
            <div className="relative z-10">
              <FindoraLogo size={26} />
            </div>
          </div>
          <div className="flex flex-col gap-0">
            <span className="gradient-brand-text text-[15px] font-extrabold leading-tight tracking-tight">
              Findora
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-text-muted-fg/80">
              Campus Lost &amp; Found
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="relative flex flex-1 flex-col overflow-y-auto px-2.5 py-3">
        {/* Primary actions */}
        <NavSection>
          {PRIMARY_NAV.map(({ label, href, Icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              isActive={isActive(href)}
              badge={label === "Messages" ? unreadMessages : undefined}
            />
          ))}
        </NavSection>

        <NavDivider />

        {/* User workspace */}
        <NavSection>
          {SECONDARY_NAV.map(({ label, href, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} isActive={isActive(href)} />
          ))}
        </NavSection>

        <NavDivider />

        {/* Support & info */}
        <NavSectionLabel label="Support" />
        <NavSection>
          {SUPPORT_NAV.map(({ label, href, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} isActive={isActive(href)} />
          ))}
        </NavSection>

        {/* Admin — isolated at bottom */}
        {isAdmin && (
          <>
            <NavDivider />
            <NavSection>
              <NavItem href="/admin" label="Admin" Icon={Shield} isActive={isActive("/admin")} />
            </NavSection>
          </>
        )}
      </nav>

      {/* ── User section ─────────────────────────────────────────── */}
      {user && (
        <div className="relative shrink-0 border-t border-border-default/70 p-2.5">
          <div className="flex items-center gap-1 rounded-2xl border border-border-default/60 bg-bg-base/60 p-1.5 backdrop-blur-md">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-bg-muted-surface"
            >
              <div className="rounded-full ring-2 ring-brand-500/30">
                <UserAvatar user={user} size="sm" />
              </div>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text-base">
                {user.full_name}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted-fg transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
