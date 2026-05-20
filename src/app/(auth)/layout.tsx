import type { Metadata } from "next";
import { AuthLayout } from "@/components/layout/auth-layout";

// Auth screens (login, callbacks) should not be indexed — they are gateway
// pages, not content. Indexing them dilutes brand search results and exposes
// error states to crawlers.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
