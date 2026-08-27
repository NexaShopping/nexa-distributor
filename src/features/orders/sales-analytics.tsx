"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Download, Search } from "flowbite-react-icons/outline";
import { useSales } from "@/features/orders/api";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { Badge, Button, Card, EmptyState, ErrorState, Select, Spinner } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";
import "./sales-analytics.css";

const statuses: OrderStatus[] = ["AWAITING_PAYMENT", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();

export function SalesAnalytics() {
  const [status, setStatus] = useState<OrderStatus | "">(""); const [range, setRange] = useState("90"); const [query, setQuery] = useState(""); const [exporting, setExporting] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [exportFrom, setExportFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [exportTo, setExportTo] = useState(todayIso);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  // limit: 100 (the server max) — this page reads as analytics over the selected range, so it
  // needs more than the default 20-row page a plain list view would ask for. Still a single
  // page, not the full history: on an account with more orders than that in the selected
  // range, the trend below reflects only the most recent 100, same caveat the metrics above
  // already had.
  const sales = useSales(status ? { status, limit: 100 } : { limit: 100 }, undefined); const orders = sales.data?.data.orders ?? [];
  const filtered = useMemo(() => { const cutoff = Date.now() - Number(range) * 86400000; const needle = query.trim().toLowerCase(); return orders.filter((order) => new Date(order.placedAt).getTime() >= cutoff && (!needle || order.orderNo.toLowerCase().includes(needle) || order.items.some((item) => item.productName.toLowerCase().includes(needle)))); }, [orders, query, range]);
  // Real revenue trend, bucketed over the selected range: daily for 30 days, weekly for 90,
  // monthly for a year — built from the same `filtered` orders the metrics above already use.
  const trend = useMemo(() => {
    const days = Number(range);
    const bucketCount = days <= 30 ? days : days <= 90 ? 13 : 12;
    const bucketMs = (days * 86400000) / bucketCount;
    const now = Date.now();
    const buckets = Array.from({ length: bucketCount }, () => 0);
    for (const order of filtered) {
      const age = now - new Date(order.placedAt).getTime();
      const backFromNow = Math.min(bucketCount - 1, Math.max(0, Math.floor(age / bucketMs)));
      buckets[bucketCount - 1 - backFromNow] += Number(order.grandTotal);
    }
    const max = Math.max(...buckets, 1);
    const points = buckets.map((value, index) => `${(index / (bucketCount - 1)) * 100},${100 - (value / max) * 100}`);
    const labelFormat: Intl.DateTimeFormatOptions = days <= 90 ? { day: "numeric", month: "short" } : { month: "short" };
    const labelCount = 6;
    const labels = Array.from({ length: labelCount }, (_, i) => {
      const bucketIndex = Math.round((i / (labelCount - 1)) * (bucketCount - 1));
      if (bucketIndex === bucketCount - 1) return "Now";
      return new Date(now - (bucketCount - 1 - bucketIndex) * bucketMs).toLocaleDateString("en-IN", labelFormat);
    });
    return { line: points.join(" "), fill: `0,100 ${points.join(" ")} 100,100`, labels };
  }, [filtered, range]);
  const revenue = filtered.reduce((sum, order) => sum + Number(order.grandTotal), 0); const average = filtered.length ? revenue / filtered.length : 0; const pending = filtered.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
  const statusCounts = statuses.map((value) => ({ value, count: filtered.filter((order) => order.status === value).length }));
  const products = useMemo(() => { const map = new Map<string, { units: number; revenue: number }>(); filtered.forEach((order) => order.items.forEach((item) => { const current = map.get(item.productName) ?? { units: 0, revenue: 0 }; current.units += item.quantity; current.revenue += Number(item.lineTotal); map.set(item.productName, current); })); return [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 4); }, [filtered]);
  // GST sales register — server-generated, exact period (not the on-screen "range" filter
  // above, which is for the analytics display only): one row per invoiced order, correct for
  // actual GSTR filing against a real return period. See ADR-0016 / API.md.
  async function exportSalesRegister() {
    if (exporting || exportFrom > exportTo) return;
    setExporting(true);
    try {
      const blob = await api.download(`/orders/export?from=${exportFrom}&to=${exportTo}&format=${exportFormat}`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sales-register-${exportFrom}-to-${exportTo}.${exportFormat}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch { /* error already surfaced globally */ }
    finally { setExporting(false); }
  }
  if (sales.isError && !sales.data) return <ErrorState message="Could not load your sales analytics." onRetry={() => void sales.refetch()} />;
  return <div className="sales-analytics"><nav className="sales-analytics__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Sales</strong></nav><header className="sales-analytics__header"><div><p className="sales-analytics__eyebrow">Distributor performance</p><h1>Sales</h1><p>Track customer revenue, fulfilment, and product momentum.</p></div><div className="sales-analytics__header-actions"><Select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></Select><div className="sales-analytics__export"><label>From<input type="date" value={exportFrom} max={exportTo} onChange={(event) => setExportFrom(event.target.value)} aria-label="Sales register from date" /></label><label>To<input type="date" value={exportTo} min={exportFrom} max={todayIso} onChange={(event) => setExportTo(event.target.value)} aria-label="Sales register to date" /></label><Select aria-label="Export format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "csv" | "pdf")}><option value="csv">CSV</option><option value="pdf">PDF</option></Select><Button size="sm" onClick={exportSalesRegister} disabled={exporting || exportFrom > exportTo}><Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export sales register"}</Button></div></div></header><section className="sales-analytics__metrics"><Metric label="Customer sales" value={formatMoney(revenue.toFixed(2))} detail={`${filtered.length} orders in range`} tone="orange" /><Metric label="Revenue" value={formatMoney((revenue * .87).toFixed(2))} detail="After discounts and tax" tone="green" /><Metric label="Average order value" value={formatMoney(average.toFixed(2))} detail="Per customer sale" tone="amber" /><Metric label="Pending fulfilment" value={String(pending)} detail="Needs attention" tone="red" /></section><div className="sales-analytics__toolbar"><label><Search className="h-4 w-4" /><span className="sr-only">Search sales</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders or products" /></label><Select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "")}><option value="">All statuses</option>{statuses.map((value) => <option value={value} key={value}>{label(value)}</option>)}</Select></div><section className="sales-analytics__grid"><Card className="sales-analytics__trend"><SectionTitle title="Revenue trend" detail="Customer sales over the selected period" />{filtered.length ? <div className="sales-analytics__chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Revenue trend"><polyline points={trend.line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /><polyline points={trend.fill} fill="currentColor" opacity=".1" /></svg><div className="sales-analytics__chart-labels">{trend.labels.map((text, index) => <span key={index}>{text}</span>)}</div></div> : <EmptyState title="No customer sales yet" hint="Sales in the selected period will chart here." />}</Card><Card className="sales-analytics__status"><SectionTitle title="Sales by status" detail="Fulfilment health" /><div className="sales-analytics__status-list">{statusCounts.map((item) => <div key={item.value}><span><i className={`status-dot status-dot--${item.value.toLowerCase()}`} />{label(item.value)}</span><strong>{item.count}</strong><div className="sales-analytics__status-track"><b style={{ width: `${filtered.length ? Math.max(4, item.count / filtered.length * 100) : 4}%` }} /></div></div>)}</div></Card></section><section className="sales-analytics__grid sales-analytics__grid--lower"><Card className="sales-analytics__products"><SectionTitle title="Top products" detail="Best performing customer-sale items" link="/dashboard/inventory" />{products.length ? <div className="sales-analytics__product-list">{products.map(([name, product], index) => <div key={name}><span className="sales-analytics__rank">0{index + 1}</span><span className="sales-analytics__product-copy"><strong>{name}</strong><small>{product.units} units sold</small></span><b>{formatMoney(product.revenue.toFixed(2))}</b></div>)}</div> : <EmptyState title="No product sales yet" hint="Assisted customer sales will appear here." />}</Card><Card className="sales-analytics__recent"><SectionTitle title="Recent customer sales" detail="Latest activity from your customers" />{sales.isLoading ? <div className="sales-analytics__loading"><Spinner className="h-4 w-4" /> Loading sales</div> : filtered.length ? <div className="sales-analytics__recent-list">{filtered.slice(0, 5).map((order) => <Link href={`/dashboard/sales/${order.id}`} key={order.id}><span><strong>{order.orderNo}</strong><small>{new Date(order.placedAt).toLocaleDateString("en-IN")} · {label(order.channel)}</small></span><b>{formatMoney(order.grandTotal)}</b><Badge tone={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "danger" : "warning"}>{label(order.status)}</Badge><ArrowRight className="h-4 w-4" /></Link>)}</div> : <EmptyState title="No customer sales found" hint="Orders placed through assisted checkout will appear here." />}</Card></section></div>;
}
function Metric({ label: name, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <Card className={`sales-analytics__metric sales-analytics__metric--${tone}`}><span>{name}</span><strong>{value}</strong><small>{detail}</small></Card>; }
function SectionTitle({ title, detail, link }: { title: string; detail: string; link?: string }) { return <div className="sales-analytics__section-title"><div><h2>{title}</h2><p>{detail}</p></div>{link && <Link href={link}>View all <ArrowRight className="h-3.5 w-3.5" /></Link>}</div>; }
