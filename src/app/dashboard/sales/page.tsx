"use client";

import Link from "next/link";
import { useState } from "react";
import { useSales, type OrderFilters } from "@/features/orders/api";
import { formatMoney } from "@/lib/money";
import { Button, EmptyState, ErrorState, Select, Spinner } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";

export default function SalesPage() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);
  const sales = useSales(filters, cursor);
  const orders = sales.data?.data.orders ?? [];
  const meta = sales.data?.meta;

  return (
    <div className="reports-page mx-auto max-w-5xl">
      <nav className="reports-heading flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link><span>›</span><strong className="font-medium text-ink">Sales</strong>
      </nav>
      <Select
        className="reports-filter mt-5 sm:w-48"
        value={filters.status ?? ""}
        onChange={(event) => { setCursors([]); setFilters({ status: (event.target.value || undefined) as OrderStatus | undefined }); }}
      >
        <option value="">Any status</option><option value="AWAITING_PAYMENT">Awaiting payment</option><option value="CONFIRMED">Confirmed</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option>
      </Select>
      <div className="mt-5">
        {sales.isLoading ? <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>
          : sales.isError ? <ErrorState message={sales.error instanceof Error ? sales.error.message : "Could not load customer sales"} onRetry={() => sales.refetch()} />
          : orders.length === 0 ? <EmptyState title="No customer sales found" hint="Orders placed through assisted checkout will appear here." />
          : <div className="reports-table overflow-x-auto rounded-xl border border-line"><table className="w-full text-sm"><thead className="bg-canvas text-left text-xs text-ink-soft"><tr><th className="px-4 py-2.5 font-medium">Order</th><th className="px-4 py-2.5 font-medium">Status</th><th className="px-4 py-2.5 font-medium">Channel</th><th className="px-4 py-2.5 text-right font-medium">Total</th><th className="px-4 py-2.5 font-medium">Placed</th></tr></thead><tbody className="divide-y divide-line bg-surface">{orders.map((order) => <tr key={order.id} className="hover:bg-canvas"><td className="px-4 py-2.5"><Link className="font-medium text-brand hover:underline" href={`/dashboard/sales/${order.id}`}>{order.orderNo}</Link></td><td className="px-4 py-2.5 capitalize">{order.status.toLowerCase().replaceAll("_", " ")}</td><td className="px-4 py-2.5 capitalize text-ink-soft">{order.channel.toLowerCase().replaceAll("_", " ")}</td><td className="px-4 py-2.5 text-right font-medium">{formatMoney(order.grandTotal)}</td><td className="px-4 py-2.5 text-xs text-ink-soft">{new Date(order.placedAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
      </div>
      {(cursors.length > 0 || meta?.hasMore) && orders.length > 0 && <div className="mt-4 flex justify-center gap-3">{cursors.length > 0 && <Button variant="secondary" size="sm" onClick={() => setCursors((current) => current.slice(0, -1))}>Previous</Button>}{meta?.hasMore && meta.cursor && <Button variant="secondary" size="sm" disabled={sales.isFetching} onClick={() => setCursors((current) => [...current, meta.cursor!])}>{sales.isFetching ? "Loading…" : "Next"}</Button>}</div>}
    </div>
  );
}
