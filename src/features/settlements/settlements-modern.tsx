"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, EmptyState, ErrorState, Select, Spinner, Button } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { api } from "@/lib/api";
import { useMyPayables, useMyPayouts } from "@/features/settlements/api";
import "./settlements-modern-header.css";

function SettlementsExport() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(todayIso);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [exporting, setExporting] = useState(false);

  async function exportSettlements() {
    if (exporting || from > to) return;
    setExporting(true);
    try {
      const blob = await api.download(`/settlements/export?from=${from}&to=${to}&format=${format}`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `settlements-${from}-to-${to}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch { /* error already surfaced globally */ }
    finally { setExporting(false); }
  }

  return (
    <div className="settlements-modern__export">
      <label>From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} aria-label="Settlements export from date" /></label>
      <label>To<input type="date" value={to} min={from} max={todayIso} onChange={(event) => setTo(event.target.value)} aria-label="Settlements export to date" /></label>
      <Select aria-label="Settlements export format" value={format} onChange={(event) => setFormat(event.target.value as "csv" | "pdf")}><option value="csv">CSV</option><option value="pdf">PDF</option></Select>
      <Button size="sm" variant="secondary" onClick={exportSettlements} disabled={exporting || from > to}>{exporting ? "Exporting…" : "Export"}</Button>
    </div>
  );
}

export function SettlementsModern() {
  const payables = useMyPayables(); const payouts = useMyPayouts(); const [status, setStatus] = useState("ALL"); const [query, setQuery] = useState("");
  if (payables.isLoading || payouts.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (payables.isError || payouts.isError) return <ErrorState message="Could not load your settlements" onRetry={() => { void payables.refetch(); void payouts.refetch(); }} />;
  const rows = payables.data?.payables ?? []; const payoutRows = payouts.data?.payouts ?? [];
  const filtered = rows.filter((row) => (status === "ALL" || row.status === status) && row.order.orderNo.toLowerCase().includes(query.toLowerCase()));
  const payableTotal = rows.filter((row) => row.status === "PAYABLE").reduce((sum, row) => sum + Number(row.amount), 0); const pendingTotal = rows.filter((row) => row.status === "HELD").reduce((sum, row) => sum + Number(row.amount), 0); const paidTotal = payoutRows.reduce((sum, row) => sum + Number(row.amount), 0);
  return <div className="settlements-modern"><nav className="settlements-modern__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Payouts</strong></nav><header><div><h1>Payouts &amp; settlements</h1><p>Track your earnings, manage withdrawals, and view settlement history.</p></div></header><Card className="settlements-modern__hero"><div><small>Available to withdraw</small><strong>{formatMoney(String(payableTotal))}</strong><span>Eligible from delivered customer sales</span></div><div className="settlements-modern__hero-meta"><div><small>Pending earnings</small><b>{formatMoney(String(pendingTotal))}</b></div><div><small>Next payout</small><b>Scheduled after eligibility</b></div></div><Button disabled={!payableTotal}>Withdraw funds</Button></Card><div className="settlements-modern__metrics"><div><small>Total paid</small><strong>{formatMoney(String(paidTotal))}</strong></div><div><small>Payable entries</small><strong>{rows.filter((r) => r.status === "PAYABLE").length}</strong></div><div><small>Settlement status</small><strong>Up to date</strong></div></div><div className="settlements-modern__body"><section className="settlements-modern__payables"><div className="settlements-modern__section-head"><div><h2>Payable earnings</h2><p>Customer-sale proceeds and eligibility status.</p></div><SettlementsExport /><div className="settlements-modern__filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" /><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="HELD">Held</option><option value="PAYABLE">Payable</option><option value="PAID">Paid</option></Select></div></div>{filtered.length ? <div className="settlements-modern__table"><div className="settlements-modern__row settlements-modern__row--head"><span>Order</span><span>Amount</span><span>Status</span><span>Eligible</span><span>Action</span></div>{filtered.map((row) => <div className="settlements-modern__row" key={row.id}><strong>{row.order.orderNo}</strong><b>{formatMoney(row.amount)}</b><span className={`settlement-status settlement-status--${row.status.toLowerCase()}`}>{row.status.toLowerCase()}</span><span>{row.eligibleAt ? new Date(row.eligibleAt).toLocaleDateString("en-IN") : "Awaiting delivery"}</span><Link href={`/dashboard/orders/${row.orderId}`}>View</Link></div>)}</div> : <EmptyState title="No settlement payables" hint="Eligible customer-sale proceeds will appear here." />}</section><aside className="settlements-modern__history"><div className="settlements-modern__section-head"><div><h2>Payout history</h2><p>Completed withdrawals</p></div></div>{payoutRows.length ? <div className="settlements-modern__payout-list">{payoutRows.map((row) => <div key={row.id}><div><strong>{formatMoney(row.amount)}</strong><span>{new Date(row.paidAt).toLocaleDateString("en-IN")} · {row.method}</span></div><small>{row.externalReference}</small></div>)}</div> : <EmptyState title="No payouts yet" hint="Completed payouts will appear here." />}</aside></div></div>;
}
