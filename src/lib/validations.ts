import { z } from "zod";
import { ITEM_CATEGORIES } from "./constants";

export const createItemSchema = z.object({
  type: z.enum(["lost", "found"]),
  category: z
    .string()
    .refine((v) => ITEM_CATEGORIES.includes(v as (typeof ITEM_CATEGORIES)[number]), {
      message: "Invalid category",
    }),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  location: z.string().min(2, "Location is required").max(200),
  // ISO date string YYYY-MM-DD, must not be in the future, must not be
  // more than 5 years ago (reasonable ceiling for a campus lost-and-found).
  date_occurred: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((v) => {
      const d = new Date(v + "T00:00:00");
      return !isNaN(d.getTime());
    }, "Invalid date")
    .refine((v) => {
      const d = new Date(v + "T00:00:00");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return d < tomorrow;
    }, "Date cannot be in the future")
    .refine((v) => {
      const d = new Date(v + "T00:00:00");
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      return d >= fiveYearsAgo;
    }, "Date cannot be more than 5 years ago"),
  // Optional verification questions (≤3, each ≤140 chars). Only meaningful
  // for type="found"; the UI hides the field for "lost". The DB enforces
  // the same bounds via the items_validate_questions trigger (mig. 0015).
  verification_questions: z
    .array(z.string().trim().min(1, "Question cannot be empty").max(140))
    .max(3, "At most 3 questions")
    .optional(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  // claim_pending, verified, and completed are lifecycle-managed by the
  // claims workflow (/api/items/[id]/complete). Owners can only move between
  // active ↔ closed directly via PATCH. "completed" can only be set through
  // the dedicated /complete endpoint which enforces ownership + audit logging.
  status: z.enum(["active", "closed"]).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createFlagSchema = z.object({
  item_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  reason: z.enum(["spam", "inappropriate", "fake", "duplicate", "other"]),
  notes: z.string().max(500).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateFlagInput = z.infer<typeof createFlagSchema>;
