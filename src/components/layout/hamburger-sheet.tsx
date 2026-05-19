"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Settings, Shield, LogOut, ChevronRight, Info, LifeBuoy } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FindoraLogo } from "@/components/shared/findora-logo";

const MENU_ITEMS = [
  {
    label: "Recovered Items",
    href: "/cases/completed",
    Icon: CheckCircle2,
    description: "Your resolved cases",
  },
  {
    label: "Settings",
    href: "/settings",
    Icon: Settings,
    description: "Account preferences",
  },
  {
    label: "About Findora",
    href: "/about",
    Icon: Info,
    description: "The story behind the product",
  },
  {
    label: "Contact & Support",
    href: "/contact",
    Icon: LifeBuoy,
    description: "Get help or support the project",
  },
] as const;

interface HamburgerSheetProps {
  children?: React.ReactNode;
}

export function HamburgerSheet({ children }: HamburgerSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent
        side="right"
        className="w-[300px] border-l border-border-default bg-bg-base p-0"
      >
        {/* ── Brand header with gradient ─────────────────────────── */}
        <div className="relative overflow-hidden border-b border-border-default">
          <div
            aria-hidden
            className="via-brand-400/8 to-violet-500/8 pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15"
          />
          <div className="relative flex h-16 items-center gap-3 px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-bg-subtle shadow-sm ring-1 ring-border-default">
              <FindoraLogo size={32} />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-text-base">Findora</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted-fg">
                Campus Lost &amp; Found
              </p>
            </div>
          </div>
        </div>

        {/* ── User profile card ──────────────────────────────────── */}
        {currentUser && (
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-border-default bg-bg-subtle px-3.5 py-3 transition-colors hover:bg-bg-muted-surface"
          >
            <UserAvatar user={currentUser} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-text-base">
                {currentUser.full_name}
              </p>
              <p className="truncate text-[11px] text-text-muted-fg">{currentUser.email}</p>
            </div>
            <ChevronRight size={14} className="shrink-0 text-text-muted-fg" />
          </Link>
        )}

        {/* ── Navigation items ──────────────────────────────────── */}
        <div className="mt-4 px-3">
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted-fg">
            Navigate
          </p>
          <div className="space-y-1">
            {MENU_ITEMS.map(({ label, href, Icon, description }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg-muted-surface"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-muted-surface">
                  <Icon size={15} aria-hidden="true" className="text-text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-text-base">{label}</div>
                  <div className="text-[11px] text-text-muted-fg">{description}</div>
                </div>
                <ChevronRight size={13} className="shrink-0 text-text-muted-fg" />
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg-muted-surface"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 dark:bg-brand-500/15">
                  <Shield
                    size={15}
                    aria-hidden="true"
                    className="text-brand-500 dark:text-brand-400"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-text-base">Admin Dashboard</div>
                  <div className="text-[11px] text-text-muted-fg">Platform management</div>
                </div>
                <ChevronRight size={13} className="shrink-0 text-text-muted-fg" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Sign out ──────────────────────────────────────────── */}
        <div className="mt-auto border-t border-border-default p-3">
          <button
            onClick={() => void handleSignOut()}
            className="hover:bg-red-500/8 dark:hover:bg-red-500/12 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/15">
              <LogOut size={15} aria-hidden="true" className="text-red-500" />
            </div>
            <span className="text-[13px] font-semibold text-red-500">Sign Out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
