"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useInventory } from "@/features/inventory/api";
import { StockItemDetail } from "@/features/inventory/stock-item-detail";
import { formatMoney } from "@/lib/money";
import { ErrorState, Spinner } from "@/components/ui";

export default function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const query = useInventory({});
  const item = query.data?.data.items.find((entry) => entry.id === params.id);
  if (query.isLoading) return <div className="grid place-items-center py-20"><Spinner className="h-5 w-5" /></div>;
  if (query.isError) return <ErrorState message="Could not load this inventory item." onRetry={() => query.refetch()} />;
  if (!item) return <ErrorState message="Inventory item not found." onRetry={() => query.refetch()} />;
  const low = item.lowStockAt !== null && item.available <= item.lowStockAt;
  const out = item.available <= 0;
  return <div className="inventory-detail-page"><header><Link href="/dashboard/inventory">←</Link><h1>Inventory Detail</h1></header><div className="inventory-detail-hero"><div className="inventory-detail-image"><img src={item.variant.product.media?.[0]?.url} alt={item.variant.product.name} /><span className={out ? "out" : low ? "low" : "good"}>{out ? "ⓘ Out of Stock" : low ? "△ Low Stock" : "✓ In Stock"}</span></div><div className="inventory-detail-copy"><h2>{item.variant.product.name}</h2><p><b>SKU: {item.variant.sku}</b><span>{item.variant.product.brand || "General"} Category</span></p></div></div><div className="inventory-detail-metrics"><div><small>Current Stock</small><strong className={out ? "danger" : ""}>{item.available}</strong><b>UNITS AVAILABLE</b></div><div><small>Retail Price</small><strong>{formatMoney(item.sellPrice)}</strong><b>PER UNIT</b></div></div><section className="inventory-status-details"><h2>Status Details</h2><dl><div><dt>Reorder Point</dt><dd>{item.lowStockAt ?? "—"} Units</dd></div><div><dt>Last Restocked</dt><dd>Available in ledger</dd></div><div><dt>Supplier</dt><dd>Nexa Central Supply</dd></div></dl></section><div className="inventory-detail-actions"><button type="button" className="audit">Audit</button><button type="button" className="update">⊕ Update Stock</button></div><div className="inventory-detail-tools"><StockItemDetail item={item} onClose={() => undefined} /></div></div>;
}
