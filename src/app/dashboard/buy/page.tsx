"use client";

import { useEffect, useState } from "react";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useStorefront } from "@/features/storefront/api";
import { useAddToCart } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { Button, EmptyState, ErrorState, Input, Spinner } from "@/components/ui";

type Toast = { tone: "success" | "error"; message: string } | null;

export default function BuyPage() {
  const admin = usePrimaryAdmin();
  const sellerAccountId = admin.data?.account.id ?? "";
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState<string | undefined>();
  const [cursors, setCursors] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const cursor = cursors.at(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCursors([]);
      setQ(qInput.trim() || undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const query = useStorefront({ sellerAccountId, q }, cursor);
  const items = query.data?.data.items ?? [];
  const meta = query.data?.meta;

  if (admin.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (admin.isError) return <ErrorState message="Could not find the NexaShopping catalog right now." onRetry={() => admin.refetch()} />;

  return (
    <div className="mx-auto max-w-6xl">
      {toast && <div className={`login-toast ${toast.tone}`} role="status"><span>{toast.tone === "success" ? "✓" : "!"}</span>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="Dismiss">×</button></div>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Buy from admin</h1><p className="mt-1 text-sm text-ink-soft">Listed stock available for your next purchase.</p></div>
        <form onSubmit={(e) => e.preventDefault()} className="w-full sm:w-72"><Input aria-label="Search SKU or product" placeholder="Search SKU / product…" value={qInput} onChange={(e) => setQInput(e.target.value)} /></form>
      </div>
      <div className="mt-5">
        {query.isLoading ? <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Could not load the catalog"} onRetry={() => query.refetch()} /> : items.length === 0 ? <EmptyState title="Nothing listed yet" hint="Check back once admin has stock available." /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <ProductCard key={item.id} item={item} sellerAccountId={sellerAccountId} onToast={setToast} />)}</div>}
      </div>
      {(cursors.length > 0 || meta?.hasMore) && items.length > 0 && <div className="mt-6 flex justify-center gap-3">{cursors.length > 0 && <Button variant="secondary" size="sm" onClick={() => setCursors((c) => c.slice(0, -1))}>Previous</Button>}{meta?.hasMore && meta.cursor && <Button variant="secondary" size="sm" disabled={query.isFetching} onClick={() => setCursors((c) => [...c, meta.cursor!])}>{query.isFetching ? "Loading…" : "Next"}</Button>}</div>}
    </div>
  );
}

function ProductCard({ item, sellerAccountId, onToast }: { item: NonNullable<ReturnType<typeof useStorefront>["data"]>["data"]["items"][number]; sellerAccountId: string; onToast: (toast: Toast) => void }) {
  const addToCart = useAddToCart(sellerAccountId);
  const media = item.variant.product.media ?? [];
  const [mediaIndex, setMediaIndex] = useState(0);
  const outOfStock = item.available <= 0;
  useEffect(() => { if (media.length < 2) return; const timer = window.setInterval(() => setMediaIndex((index) => (index + 1) % media.length), 2600); return () => window.clearInterval(timer); }, [media.length]);
  async function handleAdd() {
    try { await addToCart.mutateAsync({ variantId: item.variant.id, quantity: 1 }); onToast({ tone: "success", message: `${item.variant.product.name} added to cart.` }); }
    catch (error) { onToast({ tone: "error", message: error instanceof ApiError ? error.message : "Could not add item to cart." }); }
  }
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="relative aspect-[1.05] overflow-hidden bg-canvas">{media.length ? <img src={media[mediaIndex].url} alt={media[mediaIndex].alt ?? item.variant.product.name} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" /> : <div className="grid h-full place-items-center text-ink-soft"><BoxIcon className="h-7 w-7" /></div>}{media.length > 1 && <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">{media.map((_, index) => <span key={index} className={`h-1 rounded-full transition-all ${index === mediaIndex ? "w-4 bg-brand" : "w-1 bg-white/80"}`} />)}</div>}</div>
    <div className="flex flex-1 flex-col gap-1 p-3"><p className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-soft">{item.variant.product.brand}</p><p className="line-clamp-2 text-sm font-semibold leading-snug">{item.variant.product.name}</p><p className="truncate text-xs text-ink-soft">{item.variant.name} · {item.variant.sku}</p><div className="mt-auto flex items-center justify-between pt-2"><p className="text-sm font-semibold">{formatMoney(item.discountPrice ?? item.sellPrice)}</p><p className={`text-[11px] ${outOfStock ? "text-red-600" : "text-ink-soft"}`}>{outOfStock ? "Out of stock" : `${item.available} left`}</p></div><Button size="sm" className="mt-1 h-9 w-full" disabled={outOfStock || addToCart.isPending} onClick={handleAdd}>{addToCart.isPending ? "Adding…" : "Add to cart"}</Button></div>
  </article>;
}

function BoxIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z M3.5 7.5 12 12l8.5-4.5M12 12v9" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
