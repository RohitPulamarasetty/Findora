import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return <main className={cn("min-h-screen bg-bg-base", className)}>{children}</main>;
}
