"use client";

import { useState } from "react";
import { useAdjustStock, useLedger, useRetailPriceRange, useUpdateStockItem } from "@/features/inventory/api";
import { ApiError } from "@/lib/api";
import { Button, Card, Input, Label, Select, Spinner } from "@/components/ui";
import type { AdjustStockBody, StockItemView } from "@/lib/types";
import { formatMoney } from "@/lib/money";

export function StockItemDetail({ item, onClose }: { item: StockItemView; onClose: () => void }) {
  const image = item.variant.product.media?.[0]?.url;
  const stockState = item.available <= 0 ? "out" : item.available <= (item.lowStockAt ?? 0) ? "low" : "good";
  const statusLabel = stockState === "out" ? "Out of stock" : stockState === "low" ? "Low stock" : "In stock";
  return (
    <div className="inventory-drawer space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="inventory-drawer-kicker"><span className={`inventory-drawer-status ${stockState}`}>{statusLabel}</span><span>SKU {item.variant.sku}</span></div>
          <p className="font-medium">
            {item.variant.product.name} — {item.variant.name}
          </p>
          <p className="text-sm text-ink-soft">{item.variant.product.brand}</p>
        </div>
        <button onClick={onClose} className="inventory-drawer-close text-sm text-ink-soft hover:text-ink" aria-label="Close inventory detail">×</button>
      </div>

      <section className="inventory-drawer-hero">{image ? <img src={image} alt={item.variant.product.name} /> : <div className="inventory-drawer-image-fallback">{item.variant.product.name.slice(0, 1)}</div>}</section>
      <section className="inventory-drawer-section"><h3>Inventory overview</h3><div className="inventory-drawer-overview"><Stat label="Current stock" value={item.available} accent={stockState !== "good"} /><Stat label="Category" value={item.variant.product.brand} text /><Stat label="Unit price" value={formatMoney(item.sellPrice)} text /></div></section>
      <section className="inventory-drawer-section inventory-drawer-history"><h3>Stock history</h3><div className="inventory-drawer-history-card"><span className="inventory-drawer-history-dot" /><div><strong>{stockState === "low" ? "Stock alert triggered" : "Inventory status updated"}</strong><small>Today · Available quantity {item.available}</small></div></div></section>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="On hand" value={item.onHand} />
        <Stat label="Reserved" value={item.reserved} />
        <Stat label="Available" value={item.available} accent />
      </div>

      <PricingForm item={item} />
      <AdjustForm item={item} />
      <LedgerPanel itemId={item.id} />
    </div>
  );
}

function Stat({ label, value, accent, text }: { label: string; value: number | string; accent?: boolean; text?: boolean }) {
  return (
    <div className="inventory-drawer-stat"><span>{label}</span><strong className={accent ? "accent" : ""}>{value}</strong>{!text && <small>Units</small>}</div>
  );
}

function PricingForm({ item }: { item: StockItemView }) {
  const update = useUpdateStockItem(item.id);
  const retailRange = useRetailPriceRange(item.id);
  const [sellPrice, setSellPrice] = useState(item.sellPrice);
  const [discountPrice, setDiscountPrice] = useState(item.discountPrice ?? "");
  const [lowStockAt, setLowStockAt] = useState(item.lowStockAt?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const range = retailRange.data?.range;
    if (range) {
      const minimum = Number(range.minimumRetailPrice);
      const maximum = Number(range.maximumRetailPrice);
      const selling = Number(sellPrice);
      const discounted = discountPrice ? Number(discountPrice) : null;
      if (selling < minimum || selling > maximum || (discounted !== null && (discounted < minimum || discounted > maximum))) {
        setError(`Customer prices must stay between ${formatMoney(range.minimumRetailPrice)} and ${formatMoney(range.maximumRetailPrice)}.`);
        return;
      }
    }
    try {
      await update.mutateAsync({
        sellPrice,
        discountPrice: discountPrice || null,
        lowStockAt: lowStockAt ? Number(lowStockAt) : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  async function toggleListed() {
    try {
      await update.mutateAsync({ isListed: !item.isListed });
    } catch {
      /* surfaced via the toggle not changing */
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Pricing & listing</p>
      </div>
      <p className="text-xs text-ink-soft">
        Your price is used for customers attributed to you. Admin pricing remains the fallback when you cannot fulfil the complete cart.
      </p>
      {retailRange.isLoading && <p className="text-xs text-ink-soft">Loading the allowed customer price range…</p>}
      {retailRange.data && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Allowed customer price: {formatMoney(retailRange.data.range.minimumRetailPrice)}–
          {formatMoney(retailRange.data.range.maximumRetailPrice)}. MRP: {formatMoney(retailRange.data.range.mrp)}.
        </p>
      )}
      {retailRange.error && (
        <p className="text-xs text-red-600">
          {retailRange.error instanceof Error ? retailRange.error.message : "Could not load the allowed retail range"}
        </p>
      )}
      <form onSubmit={save} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <Label>Customer sell price (₹)</Label>
          <Input value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
        </div>
        <div>
          <Label>Customer discount price</Label>
          <Input value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
        </div>
        <div>
          <Label>Low-stock alert at</Label>
          <Input value={lowStockAt} onChange={(e) => setLowStockAt(e.target.value)} inputMode="numeric" />
        </div>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <div className="col-span-full flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={update.isPending || retailRange.isLoading || !retailRange.data}>
            {update.isPending ? "Saving…" : "Save pricing"}
          </Button>
          <Button type="button" size="sm" className="min-w-24" variant={item.isListed ? "secondary" : "primary"} onClick={toggleListed} disabled={update.isPending}>
            {item.isListed ? "Listed" : "Unlisted"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AdjustForm({ item }: { item: StockItemView }) {
  const adjust = useAdjustStock(item.id);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<AdjustStockBody["reason"]>("ADJUSTMENT");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await adjust.mutateAsync({ delta: Number(delta), reason, note: note || undefined });
      setDelta("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not adjust stock");
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">Manual adjustment</p>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label>Delta (+/-)</Label>
          <Input value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="-2" required />
        </div>
        <div>
          <Label>Reason</Label>
          <Select value={reason} onChange={(e) => setReason(e.target.value as AdjustStockBody["reason"])}>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="DAMAGE">Damage</option>
            <option value="RETURN_IN">Return in</option>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <Label>Note{reason === "ADJUSTMENT" && " (required)"}</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        <div className="col-span-full">
          <Button type="submit" size="sm" variant="secondary" disabled={adjust.isPending || !delta}>
            {adjust.isPending ? "Applying…" : "Apply adjustment"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LedgerPanel({ itemId }: { itemId: string }) {
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);
  const { data, isLoading } = useLedger(itemId, cursor);
  const entries = data?.data.entries ?? [];
  const meta = data?.meta;

  return (
    <Card className="p-4">
      <p className="text-sm font-medium">Ledger</p>
      {isLoading ? (
        <Spinner className="mt-3 h-4 w-4 text-ink-soft" />
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">No movements yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Reason</th>
                <th className="pb-2 font-medium text-right">Delta</th>
                <th className="pb-2 pr-0 text-right font-medium">On hand after</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 text-xs text-ink-soft">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="py-2 capitalize">{e.reason.toLowerCase().replace("_", " ")}</td>
                  <td className={`py-2 text-right font-medium ${e.delta < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </td>
                  <td className="py-2 text-right">{e.onHandAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(cursors.length > 0 || meta?.hasMore) && entries.length > 0 && (
        <div className="mt-3 flex justify-center gap-2">
          {cursors.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setCursors((c) => c.slice(0, -1))}>
              Previous
            </Button>
          )}
          {meta?.hasMore && meta.cursor && (
            <Button size="sm" variant="ghost" onClick={() => setCursors((c) => [...c, meta.cursor!])}>
              Older
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
