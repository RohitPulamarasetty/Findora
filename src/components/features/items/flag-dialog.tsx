"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FlagReason } from "@/types/database";

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake", label: "Fake / misleading" },
  { value: "duplicate", label: "Duplicate post" },
  { value: "other", label: "Other" },
];

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
}

export function FlagDialog({ open, onOpenChange, itemId }: FlagDialogProps) {
  const [reason, setReason] = useState<FlagReason | "">("");
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, reason, notes: notes.trim() || undefined }),
      });
      if (res.status === 409) {
        toast.info("You have already reported this item.");
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to submit report");
      } else {
        toast.success("Thank you — our moderators will review this item.");
        onOpenChange(false);
        setReason("");
        setNotes("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag size={18} className="text-red-500" />
            Report this item
          </DialogTitle>
          <DialogDescription>
            Select a reason and our team will review this report promptly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            {FLAG_REASONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  reason === value
                    ? "dark:text-brand-300 border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20"
                    : "border-border-default hover:bg-bg-subtle"
                }`}
              >
                <input
                  type="radio"
                  name="flag-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="accent-brand-500"
                />
                {label}
              </label>
            ))}
          </div>

          {reason && (
            <Textarea
              placeholder="Additional details (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="text-sm"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason || isPending}
            onClick={() => void handleSubmit()}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
