"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCustomer } from "@/features/customers/api";
import { AssistedSale } from "@/features/customers/assisted-sale";
import { ErrorState, Spinner } from "@/components/ui";
import "../../customer-sale-spacing.css";

export default function AssistedSalePage() {
  const { id } = useParams<{ id: string }>();
  const customer = useCustomer(id);
  if (customer.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (customer.isError || !customer.data) return <ErrorState message="Could not load this customer" onRetry={() => customer.refetch()} />;
  if (customer.data.customer.status !== "ACTIVE") return <ErrorState message="This customer relationship is blocked. Activate it before starting a sale." />;

  return (
    <div className="assisted-sale-page mx-auto max-w-7xl">
      <Link href={`/dashboard/customers/${id}`} className="text-sm text-ink-soft hover:text-ink">← Back to customer</Link>
      <AssistedSale relationship={customer.data.customer} />
    </div>
  );
}
