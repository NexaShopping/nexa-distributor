"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrders, type OrderFilters } from "@/features/orders/api";
import { formatMoney } from "@/lib/money";
import { Button, EmptyState, ErrorState, Select, Spinner } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";

const LEGACY_STATUS_TONES: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-neutral-100 text-neutral-600",
};

function LegacyOrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);

  const { data, isLoading, isError, error, refetch, isFetching } = useOrders(filters, cursor);
  const orders = data?.data.orders ?? [];
  const meta = data?.meta;

  function updateFilters(next: Partial<OrderFilters>) {
    setCursors([]);
    setFilters((f) => ({ ...f, ...next }));
  }

  return (
    <div className="orders-page mx-auto max-w-4xl">
      <div className="orders-heading">
        <h1 className="text-xl font-semibold">My purchases</h1>
        <p className="mt-1 text-sm text-ink-soft">Everything you&apos;ve bought from admin.</p>
      </div>

      <div className="orders-filter mt-5">
        <Select
          className="sm:w-48"
          value={filters.status ?? ""}
          onChange={(e) => updateFilters({ status: (e.target.value || undefined) as OrderStatus | undefined })}
        >
          <option value="">Any status</option>
          <option value="AWAITING_PAYMENT">Awaiting payment</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-ink-soft">
            <Spinner className="h-5 w-5" />
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Could not load your orders"} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState title="No purchases yet" hint="Orders you place will show up here." />
        ) : (
          <div className="orders-table overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-canvas">
                <tr className="text-left text-xs text-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-canvas">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-brand hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEGACY_STATUS_TONES[o.status]}`}>
                        {o.status.toLowerCase().replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatMoney(o.grandTotal)}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{new Date(o.placedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(cursors.length > 0 || meta?.hasMore) && orders.length > 0 && (
        <div className="mt-4 flex justify-center gap-3">
          {cursors.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setCursors((c) => c.slice(0, -1))}>
              Previous
            </Button>
          )}
          {meta?.hasMore && meta.cursor && (
            <Button variant="secondary" size="sm" disabled={isFetching} onClick={() => setCursors((c) => [...c, meta.cursor!])}>
              {isFetching ? "Loading…" : "Next"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { default } from "./orders-history";
