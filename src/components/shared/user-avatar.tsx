import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: { full_name: string; avatar_url?: string | null };
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({ user, size = "md", showName, className }: UserAvatarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={cn(sizeClasses[size], "ring-1 ring-border-default")}>
        <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
        <AvatarFallback className="bg-brand-500/10 font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          {getInitials(user.full_name)}
        </AvatarFallback>
      </Avatar>
      {showName && <span className="text-sm font-semibold text-text-base">{user.full_name}</span>}
    </div>
  );
}
