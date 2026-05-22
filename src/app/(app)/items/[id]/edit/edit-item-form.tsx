"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/features/items/report-form-steps/basic-info-step";
import { DetailsStep } from "@/components/features/items/report-form-steps/details-step";
import { useUpdateItem } from "@/hooks/use-update-item";
import { createItemSchema, type CreateItemInput } from "@/lib/validations";
import type { Database } from "@/types/database";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

interface EditItemFormProps {
  item: ItemRow;
}

export function EditItemForm({ item }: EditItemFormProps) {
  const router = useRouter();
  const { mutateAsync: updateItem, isPending } = useUpdateItem(item.id);
  const submittingRef = useRef(false);

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type: item.type,
      title: item.title,
      category: item.category,
      description: item.description,
      location: item.location,
      date_occurred: item.date_occurred,
    },
  });

  async function handleSubmit(values: CreateItemInput) {
    if (submittingRef.current || isPending) return;
    submittingRef.current = true;
    try {
      await updateItem(values);
      router.push(`/items/${item.id}`);
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
          }
        }}
        className="space-y-8"
      >
        <BasicInfoStep form={form} />
        <DetailsStep form={form} />
        <Button type="submit" disabled={isPending} className="w-full gap-2">
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
