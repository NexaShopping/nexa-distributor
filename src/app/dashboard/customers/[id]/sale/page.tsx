"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCustomer } from "@/features/customers/api";
import { AssistedSale } from "@/features/customers/assisted-sale";
import { ErrorState, Spinner } from "@/components/ui";

export default function AssistedSalePage() {
  const { id } = useParams<{ id: string }>();
  const customer = useCustomer(id);
  if (customer.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (customer.isError || !customer.data) return <ErrorState message="Could not load this customer" onRetry={() => customer.refetch()} />;
  if (customer.data.customer.status !== "ACTIVE") return <ErrorState message="This customer relationship is blocked. Activate it before starting a sale." />;

  return (
    <div className="assisted-sale-page mx-auto max-w-7xl">
      <Link href={`/dashboard/customers/${id}`} className="text-sm text-ink-soft hover:text-ink">← Back to customer</Link>
      <div className="assisted-sale-heading mt-3 mb-5">
        <h1 className="text-xl font-semibold">Assisted sale</h1>
        <p className="mt-1 text-sm text-ink-soft">Selling from your inventory to {customer.data.customer.displayName || customer.data.customer.customer.name || customer.data.customer.customer.phone}.</p>
      </div>
      <AssistedSale relationship={customer.data.customer} />
    </div>
  );
}
