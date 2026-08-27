"use client";

import { useParams } from "next/navigation";
import { CustomerDetailModern } from "@/features/customers/customer-detail";
import { useCustomer } from "@/features/customers/api";
import { ErrorState, Spinner } from "@/components/ui";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useCustomer(id);

  if (isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (isError || !data) return <ErrorState message={error instanceof Error ? error.message : "Could not load this customer"} onRetry={refetch} />;

  return (
    <div className="customer-detail-page w-full max-w-none">
      <CustomerDetailModern relationship={data.customer} />
    </div>
  );
}
