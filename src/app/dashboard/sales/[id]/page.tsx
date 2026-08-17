"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useOrder } from "@/features/orders/api";
import { SalesOrderDetail } from "@/features/orders/sales-order-detail";
import { ErrorState, Spinner } from "@/components/ui";

export default function SalesOrderPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);
  if (order.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (order.isError || !order.data) return <ErrorState message="Could not load this customer sale" onRetry={() => order.refetch()} />;
  return <div className="mx-auto max-w-4xl"><Link href="/dashboard/sales" className="text-sm text-ink-soft hover:text-ink">← Back to customer sales</Link><div className="mt-3"><SalesOrderDetail order={order.data.order} /></div></div>;
}
