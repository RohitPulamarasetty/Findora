"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronRight,
  Info,
  Shield,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SettingsProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  role: string;
}

interface SettingsClientProps {
  profile: SettingsProfile;
}

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", Icon: Sun },
  { value: "dark" as const, label: "Dark", Icon: Moon },
  { value: "system" as const, label: "System", Icon: Monitor },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted-fg">
      {title}
    </p>
  );
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-default bg-bg-subtle shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

function SettingsDivider() {
  return <div className="mx-4 h-px bg-border-default/60" />;
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  href,
  onClick,
  danger = false,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3.5 px-4 py-3.5 transition-colors",
        (href || onClick) && "hover:bg-bg-muted-surface active:bg-bg-muted-surface",
        danger && "text-red-600 dark:text-red-400"
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            danger ? "bg-red-500/10 dark:bg-red-500/15" : "bg-bg-muted-surface"
          )}
        >
          <Icon size={15} className={danger ? "text-red-500" : "text-text-secondary"} />
        </div>
      )}
      <span className="flex-1 text-[14px] font-medium text-text-base">{label}</span>
      {value && <span className="text-[13px] text-text-muted-fg">{value}</span>}
      {href && <ChevronRight size={14} className="shrink-0 text-text-muted-fg" />}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick)
    return (
      <button onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  return inner;
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="animate-fade-in px-4 py-6 md:mx-auto md:max-w-[640px] md:px-0 md:py-8">
      <div className="space-y-6">
        {/* ── Account ──────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader title="Account" />
          <SettingsCard>
            {/* Profile identity */}
            <div className="relative overflow-hidden">
              <div className="to-violet-500/8 h-16 bg-gradient-to-br from-brand-500/20" />
              <div className="-mt-6 flex items-center gap-4 px-4 pb-4">
                <UserAvatar user={profile} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold tracking-tight text-text-base">
                    {profile.full_name}
                  </p>
                  <p className="truncate text-[13px] text-text-secondary">{profile.email}</p>
                  <p className="mt-0.5 text-[11px] text-text-muted-fg">Joined {joinedDate}</p>
                </div>
              </div>
            </div>
            <SettingsDivider />
            <SettingsRow label="Edit profile" href="/profile" />
          </SettingsCard>
        </section>

        {/* ── Appearance ───────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader title="Appearance" />
          <SettingsCard>
            <div className="p-4">
              <p className="mb-3 text-[13px] font-semibold text-text-base">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-2xl border py-4 text-xs font-semibold transition-all duration-150",
                      theme === value
                        ? "bg-brand-500/8 dark:bg-brand-500/12 border-brand-500/50 text-brand-600 shadow-sm dark:text-brand-400"
                        : "border-border-default bg-bg-base text-text-secondary hover:border-border-strong hover:bg-bg-subtle"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        theme === value
                          ? "bg-brand-500/12 dark:bg-brand-500/18"
                          : "bg-bg-muted-surface"
                      )}
                    >
                      <Icon
                        size={18}
                        className={
                          theme === value
                            ? "text-brand-500 dark:text-brand-400"
                            : "text-text-muted-fg"
                        }
                      />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </SettingsCard>
        </section>

        {/* ── About ────────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader title="About" />
          <SettingsCard>
            <SettingsRow icon={Info} label="Version" value="1.0.0" />
            <SettingsDivider />
            <SettingsRow icon={Shield} label="Campus" value="IIT Madras" />
            <SettingsDivider />
            <SettingsRow icon={Info} label="About Findora" href="/about" />
            <SettingsDivider />
            <SettingsRow icon={LifeBuoy} label="Contact & Support" href="/contact" />
          </SettingsCard>
        </section>

        {/* ── Session ──────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader title="Session" />
          <SettingsCard>
            <SettingsRow
              icon={LogOut}
              label="Sign out"
              onClick={() => void handleSignOut()}
              danger
            />
          </SettingsCard>
        </section>
      </div>
    </div>
  );
}
