import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ReportForm } from "@/components/features/items/report-form";

export const metadata: Metadata = {
  title: "Report Item",
};

export default function ReportPage() {
  return (
    <main className="page-safe-bottom">
      <PageHeader title="Report an Item" back="/home" sticky />
      <div className="px-4 py-5 md:px-6">
        <div className="mx-auto max-w-xl">
          {/* Card wrapper */}
          <div className="rounded-2xl border border-border-default bg-bg-base p-5 shadow-sm sm:p-6">
            <ReportForm />
          </div>
        </div>
      </div>
    </main>
  );
}
