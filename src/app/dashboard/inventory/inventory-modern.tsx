"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInventory, useRecentLedger, type InventoryFilters } from "@/features/inventory/api";
import { StockItemDetail } from "@/features/inventory/stock-item-detail";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { RecentLedgerEntry, StockItemView } from "@/lib/types";
import { EmptyState, ErrorState, Input, Spinner } from "@/components/ui";

function Icon({ name, className = "h-4 w-4" }: { name: "search" | "refresh" | "box" | "check" | "warning" | "close" | "arrow"; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14M21 19v-5h-5" /></>,
    box: <><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    check: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    warning: <><path d="m12 4 8 15H4L12 4Z" /><path d="M12 9v4M12 16h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
function stockState(item: StockItemView) { if (item.available <= 0) return "out"; if (item.lowStockAt !== null && item.available <= item.lowStockAt) return "low"; return "good"; }

function timeAgo(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

const LEDGER_REASON_LABEL: Record<string, string> = {
  PURCHASE_IN: "Restock received",
  TRANSFER_IN: "Stock transferred in",
  TRANSFER_OUT: "Stock transferred out",
  SALE_OUT: "Sold to customer",
  RETURN_IN: "Return received",
  RESERVE: "Stock reserved",
  RELEASE: "Reservation released",
  ADJUSTMENT: "Quantity corrected",
  DAMAGE: "Stock damaged",
};

function ledgerTone(entry: RecentLedgerEntry): "good" | "low" | "out" {
  if (entry.reason === "DAMAGE") return "out";
  return entry.delta < 0 ? "low" : "good";
}

async function downloadCsv(path: string, filename: string) {
  const blob = await api.download(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function InventoryModern() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [query, setQuery] = useState("");
  const [listed, setListed] = useState<"all" | "listed" | "unlisted">("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [sort, setSort] = useState("low");
  const [cursors, setCursors] = useState<string[]>([]);
  const [selected, setSelected] = useState<StockItemView | null>(null);
  const [exportingStock, setExportingStock] = useState(false);
  const [exportingLedger, setExportingLedger] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [ledgerFrom, setLedgerFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [ledgerTo, setLedgerTo] = useState(todayIso);
  const [stockFormat, setStockFormat] = useState<"csv" | "pdf">("csv");
  const [ledgerFormat, setLedgerFormat] = useState<"csv" | "pdf">("csv");
  async function exportStockSnapshot() {
    if (exportingStock) return;
    setExportingStock(true);
    try { await downloadCsv(`/inventory/export?format=${stockFormat}`, `inventory-snapshot-${todayIso}.${stockFormat}`); }
    catch { /* error already surfaced globally */ }
    finally { setExportingStock(false); }
  }
  async function exportStockLedger() {
    if (exportingLedger || ledgerFrom > ledgerTo) return;
    setExportingLedger(true);
    try { await downloadCsv(`/inventory/ledger/export?from=${ledgerFrom}&to=${ledgerTo}&format=${ledgerFormat}`, `inventory-ledger-${ledgerFrom}-to-${ledgerTo}.${ledgerFormat}`); }
    catch { /* error already surfaced globally */ }
    finally { setExportingLedger(false); }
  }
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useInventory(filters, cursor);
  const items = data?.data.items ?? [];
  const recentLedger = useRecentLedger(3);
  const nextCursor = data?.meta?.cursor;
  const hasMore = data?.meta?.hasMore ?? false;
  useEffect(() => { const value = searchParams.get("q") ?? ""; setQuery(value); if (value) setFilters((current) => ({ ...current, q: value })); }, [searchParams]);
  const visible = useMemo(() => {
    const filtered = items.filter((item) => !lowOnly || stockState(item) === "low");
    return [...filtered].sort((a, b) => sort === "high" ? b.available - a.available : sort === "name" ? a.variant.product.name.localeCompare(b.variant.product.name) : a.available - b.available);
  }, [items, lowOnly, sort]);
  const metrics = { total: items.length, inStock: items.filter((item) => stockState(item) === "good").length, low: items.filter((item) => stockState(item) === "low").length, out: items.filter((item) => stockState(item) === "out").length };
  const healthy = metrics.total ? Math.round((metrics.inStock / metrics.total) * 100) : 0;
  function applyFilters(next: InventoryFilters) { setCursors([]); setFilters((current) => ({ ...current, ...next })); }
  function search(event: React.FormEvent) { event.preventDefault(); applyFilters({ q: query.trim() || undefined }); }
  const metricData = [["Total products", metrics.total, "All catalog items", "box", "orange"], ["In stock", metrics.inStock, "Ready to sell", "check", "green"], ["Low stock", metrics.low, "Needs attention", "warning", "amber"], ["Out of stock", metrics.out, "Currently unavailable", "box", "red"]] as const;
  return <section className="inventory-modern" aria-labelledby="inventory-title">
    <div className="inventory-modern__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Inventory</strong></div>
    <div className="inventory-modern__metrics">{metricData.map(([label, value, detail, icon, tone]) => <div className={"inventory-modern__metric inventory-modern__metric--" + tone} key={label}><div><span>{label}</span><strong>{isLoading ? "—" : value}</strong><small>{detail}</small></div><i className={"inventory-modern__metric-icon inventory-modern__metric-icon--" + tone}><Icon name={icon} /></i></div>)}</div>
    <div className="inventory-modern__health"><div><p>Stock health</p><strong>{healthy}% healthy</strong><span>{metrics.low} items need replenishment</span></div><div className="inventory-modern__health-right"><div className="inventory-modern__health-bar"><b style={{ width: (metrics.total ? (metrics.inStock / metrics.total) * 100 : 0) + "%" }} /><b className="low" style={{ width: (metrics.total ? (metrics.low / metrics.total) * 100 : 0) + "%" }} /><b className="out" style={{ width: (metrics.total ? (metrics.out / metrics.total) * 100 : 0) + "%" }} /></div><div className="inventory-modern__legend"><span><i className="good" />Healthy</span><span><i className="low" />Low</span><span><i className="out" />Out</span><small><Icon name="refresh" />Updated just now</small></div></div></div>
    <div className="inventory-modern__toolbar"><form onSubmit={search} className="inventory-modern__search"><Icon name="search" /><Input aria-label="Search inventory" placeholder="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} /></form><div className="inventory-modern__segmented"><button className={listed === "all" ? "active" : ""} onClick={() => { setListed("all"); applyFilters({ isListed: undefined }); }} type="button">All</button><button className={listed === "listed" ? "active" : ""} onClick={() => { setListed("listed"); applyFilters({ isListed: true }); }} type="button">Listed</button><button className={listed === "unlisted" ? "active" : ""} onClick={() => { setListed("unlisted"); applyFilters({ isListed: false }); }} type="button">Unlisted</button></div><label className="inventory-modern__toggle"><input type="checkbox" checked={lowOnly} onChange={(event) => { setLowOnly(event.target.checked); applyFilters({ lowStock: event.target.checked || undefined }); }} /><span />Low stock only</label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort inventory"><option value="low">Stock: low to high</option><option value="high">Stock: high to low</option><option value="name">Product name</option></select><button type="button" className="inventory-modern__refresh" aria-label="Refresh inventory" onClick={() => refetch()} disabled={isFetching}><Icon name="refresh" /></button></div>
    <div className="inventory-modern__body"><div className="inventory-modern__table-card">{isLoading ? <div className="inventory-modern__loading"><Spinner className="h-5 w-5" />Loading inventory…</div> : isError ? <ErrorState message={error instanceof Error ? error.message : "Could not load your inventory"} onRetry={refetch} /> : visible.length === 0 ? <EmptyState title="No inventory found" hint="Try clearing a filter or searching for another item." /> : <><div className="inventory-modern__table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Listing</th><th>Status</th><th>Wholesale price</th><th>Updated</th><th>Action</th></tr></thead><tbody>{visible.map((item) => { const state = stockState(item); return <tr key={item.id} onClick={() => setSelected(item)}><td><div className="inventory-modern__product">{item.variant.product.media?.[0]?.url ? <img src={item.variant.product.media[0].url} alt="" /> : <span><Icon name="box" /></span>}<div><strong>{item.variant.product.name}</strong><small>{item.variant.sku}</small></div></div></td><td>{item.variant.product.brand || "General"}</td><td className="inventory-modern__number">{item.available}<small>units</small></td><td><span className={"inventory-modern__listed " + (item.isListed ? "yes" : "no")}>{item.isListed ? "Listed" : "Unlisted"}</span></td><td><span className={"inventory-modern__stock inventory-modern__stock--" + state}>{state === "good" ? "In stock" : state === "low" ? "Low stock" : "Out of stock"}</span></td><td className="inventory-modern__price">{formatMoney(item.sellPrice)}</td><td className="inventory-modern__updated">Today</td><td><button type="button" className="inventory-modern__view" onClick={(event) => { event.stopPropagation(); setSelected(item); }}>View <Icon name="arrow" /></button></td></tr>; })}</tbody></table></div><div className="inventory-modern__mobile-list">{visible.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item)}><span>{item.variant.product.name}<small>{item.variant.sku} · {item.available} units</small></span><b className={"inventory-modern__stock inventory-modern__stock--" + stockState(item)}>{stockState(item) === "good" ? "In stock" : stockState(item) === "low" ? "Low stock" : "Out of stock"}</b><Icon name="arrow" /></button>)}</div><div className="inventory-modern__footer"><span>Showing {visible.length} of {items.length} products</span><div><button disabled={!cursors.length} onClick={() => setCursors((current) => current.slice(0, -1))}>Previous</button><button disabled={!hasMore || isFetching} onClick={() => nextCursor && setCursors((current) => [...current, nextCursor])}>Next</button></div></div></>}</div><div className="inventory-modern__history"><div className="inventory-modern__history-card"><div className="inventory-modern__card-head"><div><p>Recent stock history</p><span>Latest movements across your inventory</span></div><Link href="/dashboard/inventory">View ledger</Link></div>{recentLedger.isLoading ? <div className="inventory-modern__loading"><Spinner className="h-4 w-4" />Loading…</div> : recentLedger.data?.entries.length ? recentLedger.data.entries.map((entry) => <History key={entry.id} title={LEDGER_REASON_LABEL[entry.reason] ?? entry.reason} product={entry.productName} detail={`${entry.delta > 0 ? "+" : ""}${entry.delta} units · ${timeAgo(entry.createdAt)}`} tone={ledgerTone(entry)} />) : <EmptyState title="No stock movement yet" hint="Restocks, sales, and corrections will show up here." />}</div><div className="inventory-modern__actions"><p>Inventory actions</p><span>Keep your catalog current and ready to sell.</span><div className="inventory-modern__ledger-export"><select aria-label="Inventory snapshot export format" value={stockFormat} onChange={(event) => setStockFormat(event.target.value as "csv" | "pdf")}><option value="csv">CSV</option><option value="pdf">PDF</option></select><button type="button" onClick={exportStockSnapshot} disabled={exportingStock}>{exportingStock ? "Exporting…" : "Export inventory snapshot"} <Icon name="arrow" /></button></div><div className="inventory-modern__ledger-export"><span>Ledger export</span><div className="inventory-modern__ledger-export-dates"><input type="date" aria-label="Ledger export from date" value={ledgerFrom} max={ledgerTo} onChange={(event) => setLedgerFrom(event.target.value)} /><input type="date" aria-label="Ledger export to date" value={ledgerTo} min={ledgerFrom} max={todayIso} onChange={(event) => setLedgerTo(event.target.value)} /><select aria-label="Ledger export format" value={ledgerFormat} onChange={(event) => setLedgerFormat(event.target.value as "csv" | "pdf")}><option value="csv">CSV</option><option value="pdf">PDF</option></select></div><button type="button" onClick={exportStockLedger} disabled={exportingLedger || ledgerFrom > ledgerTo}>{exportingLedger ? "Exporting…" : "Export ledger"} <Icon name="arrow" /></button></div></div></div></div>
    {selected && <div className="inventory-modern__modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><div className="inventory-modern__modal" role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title"><div className="inventory-modern__modal-head"><div><p>Inventory item</p><h2 id="inventory-modal-title">{selected.variant.product.name}</h2><span>{selected.variant.sku} · {selected.variant.product.brand || "General"}</span></div><button type="button" onClick={() => setSelected(null)} aria-label="Close item operations"><Icon name="close" /></button></div><div className="inventory-modern__modal-scroll"><StockItemDetail item={selected} onClose={() => setSelected(null)} /></div></div></div>}
  </section>;
}
function History({ title, product, detail, tone }: { title: string; product: string; detail: string; tone: string }) { return <div className="inventory-modern__history-row"><i className={"inventory-modern__history-dot " + tone} /><div><strong>{title}</strong><span>{product}</span></div><small>{detail}</small></div>; }
