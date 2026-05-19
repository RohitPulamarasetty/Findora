"use client";

import { useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isSearching?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search items…",
  className,
  isSearching = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative flex items-center", className)}>
      <span className="pointer-events-none absolute left-3.5 flex items-center">
        {isSearching ? (
          <Loader2 size={15} className="animate-spin text-brand-500" aria-hidden="true" />
        ) : (
          <Search size={15} className="text-text-muted-fg" aria-hidden="true" />
        )}
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border bg-bg-subtle pl-10 pr-9",
          "text-[13.5px] font-medium text-text-base placeholder:font-normal placeholder:text-text-muted-fg",
          "transition-all duration-200",
          "hover:border-border-strong",
          "focus:border-brand-500/50 focus:bg-bg-base focus:outline-none focus:ring-2 focus:ring-brand-500/15",
          isSearching ? "border-brand-500/40" : "border-border-default"
        )}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-text-muted-fg transition-colors hover:bg-bg-muted-surface hover:text-text-base"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
