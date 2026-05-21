import { ForceDarkTheme } from "@/components/shared/force-dark-theme";

/**
 * Public/marketing route group: landing, about, privacy, terms, contact.
 * Locked to dark mode for the cinematic guest experience. URLs are
 * unchanged — Next.js route groups don't affect the URL path.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <ForceDarkTheme>{children}</ForceDarkTheme>;
}
