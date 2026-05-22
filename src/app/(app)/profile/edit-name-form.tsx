"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditNameFormProps {
  initialName: string;
  userId: string;
  /** Called after a successful save so the parent can patch the query cache. */
  onSaveSuccess?: (newName: string) => void;
}

export function EditNameForm({ initialName, userId, onSaveSuccess }: EditNameFormProps) {
  const [name, setName] = useState(initialName);
  const [isPending, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      setIsEditing(false);
      return;
    }
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ full_name: trimmed }).eq("id", userId);
    setIsPending(false);
    if (error) {
      toast.error("Failed to update name");
    } else {
      toast.success("Name updated");
      setIsEditing(false);
      // Optimistically patch the profile user cache before the realtime
      // UPDATE event arrives (avoids a ~200–400 ms display lag).
      onSaveSuccess?.(trimmed);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-text-base">{name}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 max-w-[220px] text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleSave();
          if (e.key === "Escape") setIsEditing(false);
        }}
      />
      <Button size="sm" onClick={() => void handleSave()} disabled={isPending}>
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setName(initialName);
          setIsEditing(false);
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
