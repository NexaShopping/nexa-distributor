"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useInventory, type InventoryFilters } from "@/features/inventory/api";
import { StockItemDetail } from "@/features/inventory/stock-item-detail";
import { formatMoney } from "@/lib/money";
import type { StockItemView } from "@/lib/types";
import { Button, EmptyState, ErrorState, Input, Select, Spinner } from "@/components/ui";

function LegacyInventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [qInput, setQInput] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useInventory(filters, cursor);
  const items = data?.data.items ?? [];
  const meta = data?.meta;
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const inStock = items.filter((item) => item.available > 0).length;
  const lowStock = items.filter((item) => item.lowStockAt !== null && item.available <= item.lowStockAt).length;
  const outOfStock = items.filter((item) => item.available <= 0).length;

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) setQInput(query);
    if (query) setFilters((current) => ({ ...current, q: query }));
  }, [searchParams]);

  function updateFilters(next: Partial<InventoryFilters>) { setCursors([]); setFilters((value) => ({ ...value, ...next })); }
  function search(event: React.FormEvent) { event.preventDefault(); updateFilters({ q: qInput.trim() || undefined }); }

  return <div className="inventory-page">
    <div className="inventory-mobile-head"><div><span>Distributor Portal</span><h1>Inventory</h1></div><button type="button" aria-label="Notifications">♧</button><div className="inventory-avatar">N</div></div>
    <div className="inventory-heading"><div><div className="inventory-breadcrumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Inventory</strong></div><h1>Inventory</h1><p>Manage your available products and stock.</p></div><button type="button" className="inventory-add">＋ Add Product</button></div>

    <div className="inventory-stats"><StatCard label="Total Products" value={items.length} icon="▣" tone="orange" /><StatCard label="In Stock" value={inStock} icon="✓" tone="green" /><StatCard label="Low Stock" value={lowStock} icon="△" tone="yellow" /><StatCard label="Out of Stock" value={outOfStock} icon="!" tone="red" /></div>
    <div className="inventory-health"><div className="inventory-health-head"><strong>Overall Stock Health</strong><b>{items.length ? Math.round((inStock / items.length) * 100) : 0}% Healthy</b></div><div className="inventory-health-bar"><span style={{ width: `${items.length ? (inStock / items.length) * 100 : 0}%` }} /></div><div className="inventory-controls"><span className="inventory-filter-label">☷ Filters:</span><Select value={filters.isListed === undefined ? "" : String(filters.isListed)} onChange={(event) => updateFilters({ isListed: event.target.value === "" ? undefined : event.target.value === "true" })}><option value="">Stock Status: All</option><option value="true">Listed</option><option value="false">Unlisted</option></Select><Select value={filters.lowStock ? "true" : ""} onChange={(event) => updateFilters({ lowStock: event.target.value === "true" || undefined })}><option value="">Category: All</option><option value="true">Low Stock</option></Select><span className="inventory-sort">Sort by: <select><option>Stock (Low to High)</option><option>Stock (High to Low)</option></select></span></div></div>

    <div className="inventory-mobile-search"><form onSubmit={search}><Input aria-label="Search inventory" placeholder="Search inventory..." value={qInput} onChange={(event) => setQInput(event.target.value)} /></form></div>
    <div className="inventory-mobile-chips"><button className="active" type="button" onClick={() => updateFilters({ lowStock: undefined })}>All Items</button><button type="button" onClick={() => updateFilters({ lowStock: true })}>● Low Stock ({lowStock})</button><button type="button" onClick={() => updateFilters({ lowStock: false })}>In Stock</button></div>

    <div className="inventory-content"><div className="inventory-list">{isLoading ? <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div> : isError ? <ErrorState message={error instanceof Error ? error.message : "Could not load your inventory"} onRetry={refetch} /> : items.length === 0 ? <EmptyState title="Nothing in stock yet" hint="Buy something from admin to start building your inventory." action={<Link href="/dashboard/buy"><Button size="sm">Buy from admin</Button></Link>} /> : <><div className="inventory-table"><div className="inventory-table-head"><span>Product</span><span>SKU</span><span>Category</span><span>Current Stock</span><span>Status</span><span>Price (Wholesale)</span><span>Actions</span></div>{items.map((item) => <InventoryRow key={item.id} item={item} selected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} />)}</div><div className="inventory-mobile-cards">{items.map((item) => <InventoryCard key={item.id} item={item} />)}</div><div className="inventory-footer"><span>Showing {items.length} products</span><div><button type="button" disabled={!cursors.length} onClick={() => setCursors((value) => value.slice(0, -1))}>Previous</button><button type="button" disabled={!meta?.hasMore || isFetching} onClick={() => meta?.cursor && setCursors((value) => [...value, meta.cursor!])}>Next</button></div></div></>}</div><aside className="inventory-detail-pane">{selected ? <StockItemDetail item={selected} onClose={() => setSelectedId(null)} /> : <div className="inventory-empty-detail"><span>◫</span><p>Select an item to view stock details</p></div>}</aside></div>
    <div className="inventory-mobile-nav"><Link href="/dashboard">▦<span>Dashboard</span></Link><Link className="active" href="/dashboard/inventory">▣<span>Inventory</span></Link><Link href="/dashboard/orders">▤<span>Orders</span></Link><Link href="/dashboard/credit">⚙<span>Settings</span></Link></div>
  </div>;
}

export { default } from "./inventory-modern";

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) { return <div className="inventory-stat"><div><small>{label}</small><strong>{value.toLocaleString()}</strong></div><span className={`inventory-stat-icon ${tone}`}>{icon}</span></div>; }

function InventoryRow({ item, selected, onSelect }: { item: StockItemView; selected: boolean; onSelect: () => void }) { const low = item.lowStockAt !== null && item.available <= item.lowStockAt; const out = item.available <= 0; return <button type="button" className={`inventory-row ${selected ? "selected" : ""}`} onClick={onSelect}><span className="inventory-product"><img src={item.variant.product.media?.[0]?.url} alt="" /><b>{item.variant.product.name}</b></span><span className="inventory-sku">{item.variant.sku}</span><span>{item.variant.product.brand || "General"}</span><strong className={out ? "danger" : ""}>{item.available}</strong><span className={`inventory-status ${out ? "out" : low ? "low" : "good"}`}>{out ? "ⓘ Out of Stock" : low ? "△ Low Stock" : "ⓘ In Stock"}</span><span>{formatMoney(item.sellPrice)}</span><span className="inventory-more">⋮</span></button>; }

function InventoryCard({ item }: { item: StockItemView }) { const low = item.lowStockAt !== null && item.available <= item.lowStockAt; const out = item.available <= 0; return <Link href={`/dashboard/inventory/${item.id}`} className={`inventory-card ${out ? "muted" : ""}`}><img src={item.variant.product.media?.[0]?.url} alt="" /><div><h2>{item.variant.product.name}</h2><p>SKU: {item.variant.sku}</p></div><div className="inventory-card-stock"><strong>{item.available} units</strong><span className={out ? "out" : low ? "low" : "good"}>{out ? "ⓘ OUT" : low ? "△ LOW" : "✓ GOOD"}</span></div><b className="inventory-more">⋮</b></Link>; }
