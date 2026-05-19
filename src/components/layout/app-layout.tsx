import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  user?: { full_name: string; avatar_url: string | null };
  className?: string;
}

export function AppLayout({ children, isAdmin, user, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base">
      <SidebarNav isAdmin={isAdmin} user={user} />
      <main
        className={cn(
          "min-h-screen",
          "pb-bottom-nav",
          "md:ml-sidebar md:pb-0",
          "md:max-w-[calc(1280px+220px)]",
          className
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
