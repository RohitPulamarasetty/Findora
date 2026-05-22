"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, User, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useNavTransition } from "@/hooks/use-nav-transition";
import { HamburgerSheet } from "./hamburger-sheet";

const NAV_ITEMS = [
  { label: "Home", href: "/home", Icon: Home },
  { label: "Messages", href: "/messages", Icon: MessageCircle },
  { label: "Report", href: "/report", Icon: PlusCircle },
  { label: "Profile", href: "/profile", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const unreadMessages = useAppStore((s) => s.unreadMessages);
  const { isPending, pendingHref, linkProps } = useNavTransition();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div
        className="px-4 pt-1"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex h-[62px] items-center justify-around rounded-[26px] border border-border-default/40 bg-bg-base/80 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/[0.07] dark:bg-bg-subtle/85 dark:shadow-[0_8px_40px_rgba(0,0,0,0.65),0_2px_12px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.04)]">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const isActiveRoute =
              pathname === href || (href !== "/home" && pathname.startsWith(href));
            // Optimistic active: while we're navigating *to* this href, treat
            // it as active so the pill/icon flips immediately on tap.
            const isPendingTarget = isPending && pendingHref === href;
            const active = isActiveRoute || isPendingTarget;
            const isReport = href === "/report";

            return (
              <motion.div
                key={href}
                whileTap={{ scale: 0.84, transition: { duration: 0.1 } }}
                className="flex flex-1 flex-col items-center"
              >
                <Link
                  href={href}
                  {...linkProps(href)}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center gap-1"
                >
                  {isReport ? (
                    /* Floating action button for Report */
                    <span className="relative flex h-[48px] w-[48px] items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-400 via-brand-500 to-accentc-600 shadow-[0_8px_24px_rgb(var(--color-brand-500)/0.55),0_1px_0_rgba(255,255,255,0.2)_inset]">
                      <span className="absolute inset-0 rounded-[18px] bg-gradient-to-t from-transparent to-white/10" />
                      <Icon size={22} aria-hidden="true" className="relative text-white" />
                    </span>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "relative flex h-9 w-9 items-center justify-center rounded-[14px] transition-all duration-200",
                          active
                            ? "bg-gradient-to-br from-brand-500/20 to-accentc-500/20 text-brand-500 ring-1 ring-brand-500/30 dark:text-brand-400"
                            : "text-text-muted-fg"
                        )}
                      >
                        <Icon size={20} aria-hidden="true" strokeWidth={active ? 2.5 : 1.8} />
                        {label === "Messages" && unreadMessages > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accentc-500 px-1 text-[9px] font-bold leading-none text-white shadow-[0_2px_8px_rgb(var(--color-brand-500)/0.5)] ring-2 ring-bg-base dark:ring-bg-subtle">
                            {unreadMessages > 9 ? "9+" : unreadMessages}
                          </span>
                        )}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="nav-dot"
                          className="h-1 w-1 rounded-full bg-brand-500 dark:bg-brand-400"
                          transition={{ type: "spring", stiffness: 600, damping: 40 }}
                        />
                      )}
                    </>
                  )}
                </Link>
              </motion.div>
            );
          })}

          {/* More / hamburger */}
          <div className="flex flex-1 flex-col items-center">
            <HamburgerSheet>
              <button aria-label="More options" className="flex flex-col items-center gap-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-[14px] text-text-muted-fg">
                  <MoreHorizontal size={20} aria-hidden="true" strokeWidth={1.8} />
                </span>
              </button>
            </HamburgerSheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
