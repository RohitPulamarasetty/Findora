"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={reduced ? undefined : container}
      initial={reduced ? false : "hidden"}
      animate={reduced ? false : "visible"}
      className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
    >
      {icon && (
        <motion.div
          variants={reduced ? undefined : item}
          className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border-default bg-gradient-to-br from-brand-500/10 via-bg-subtle to-accentc-500/10 text-brand-500 shadow-[0_10px_30px_rgb(var(--color-brand-500)/0.15),inset_0_1px_0_rgba(255,255,255,0.5)] dark:text-brand-400 dark:shadow-[0_10px_30px_rgb(var(--color-brand-500)/0.2),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <span
            aria-hidden
            className="absolute -inset-3 -z-10 rounded-[28px] bg-gradient-to-br from-brand-500/20 via-transparent to-accentc-500/20 blur-2xl"
          />
          {icon}
        </motion.div>
      )}
      <motion.h3
        variants={reduced ? undefined : item}
        className="mb-1.5 text-[15px] font-bold tracking-tight text-text-base"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          variants={reduced ? undefined : item}
          className="mb-5 max-w-[260px] text-sm leading-relaxed text-text-muted-fg"
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div variants={reduced ? undefined : item}>
          {action.href ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
