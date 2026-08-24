"use client";

import { Card, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { useMyPayables, useMyPayouts } from "@/features/settlements/api";

export default function SettlementsPage() {
  const payables = useMyPayables();
  const payouts = useMyPayouts();
  if (payables.isLoading || payouts.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (payables.isError || payouts.isError) return <ErrorState message="Could not load your settlements" onRetry={() => { void payables.refetch(); void payouts.refetch(); }} />;
  const rows = payables.data?.payables ?? [];
  const payoutRows = payouts.data?.payouts ?? [];
  return <div className="settlements-page mx-auto max-w-5xl space-y-6">
    <div className="settlements-heading"><h1 className="text-xl font-semibold">Settlements</h1><p className="mt-1 text-sm text-ink-soft">Track customer-sale proceeds released by NexaShopping.</p></div>
    <section><h2 className="text-base font-semibold">Payables</h2><Card className="settlement-card mt-3 overflow-hidden">{rows.length ? <div className="divide-y divide-line">{rows.map((row) => <div key={row.id} className="settlement-row grid gap-2 px-4 py-3 text-sm sm:grid-cols-5"><span className="font-mono text-xs text-ink-soft">{row.order.orderNo}</span><span>{row.status}</span><span>{row.eligibleAt ? `Eligible ${new Date(row.eligibleAt).toLocaleDateString("en-IN")}` : "Awaiting delivery"}</span><span>{row.paidAt ? `Paid ${new Date(row.paidAt).toLocaleDateString("en-IN")}` : "Not paid"}</span><strong className="sm:text-right">{formatMoney(row.amount)}</strong></div>)}</div> : <EmptyState title="No settlement payables" hint="Eligible customer-sale proceeds will appear here." />}</Card></section>
    <section><h2 className="text-base font-semibold">Payout history</h2><Card className="settlement-card mt-3 overflow-hidden">{payoutRows.length ? <div className="divide-y divide-line">{payoutRows.map((row) => <div key={row.id} className="settlement-row flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>{new Date(row.paidAt).toLocaleDateString("en-IN")} · {row.method}</span><span className="font-medium">{formatMoney(row.amount)} · {row.externalReference}</span></div>)}</div> : <EmptyState title="No payouts yet" hint="Completed payouts will appear here." />}</Card></section>
  </div>;
}
