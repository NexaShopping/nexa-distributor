"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerDetail } from "@/features/customers/customer-detail";
import { useCustomer } from "@/features/customers/api";
import { ErrorState, Spinner } from "@/components/ui";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useCustomer(id);

  if (isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (isError || !data) return <ErrorState message={error instanceof Error ? error.message : "Could not load this customer"} onRetry={refetch} />;

  return (
    <div className="customer-detail-page mx-auto max-w-4xl">
      <Link href="/dashboard/customers" className="text-sm text-ink-soft hover:text-ink">← Back to customers</Link>
      <div className="mt-3"><CustomerDetail relationship={data.customer} /></div>
    </div>
  );
}
