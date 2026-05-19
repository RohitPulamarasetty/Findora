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
  date_occurred: z.string(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  status: z.enum(["active", "claim_pending", "verified", "completed", "closed"]).optional(),
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
