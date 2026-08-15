"use client";

import { useState } from "react";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useStorefront } from "@/features/storefront/api";
import { useAddToCart } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { Button, EmptyState, ErrorState, Input, Spinner } from "@/components/ui";

export default function BuyPage() {
  const admin = usePrimaryAdmin();
  const sellerAccountId = admin.data?.account.id ?? "";

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);

  const { data, isLoading, isError, error, refetch, isFetching } = useStorefront({ sellerAccountId, q }, cursor);
  const items = data?.data.items ?? [];
  const meta = data?.meta;

  function search(e: React.FormEvent) {
    e.preventDefault();
    setCursors([]);
    setQ(qInput || undefined);
  }

  if (admin.isLoading) {
    return (
      <div className="grid place-items-center py-20 text-ink-soft">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (admin.isError) {
    return <ErrorState message="Could not find the NexaShopping catalog right now." onRetry={() => admin.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Buy from admin</h1>
        <p className="mt-1 text-sm text-ink-soft">What NexaShopping currently has listed for you to stock up on.</p>
      </div>

      <form onSubmit={search} className="mt-5 max-w-xs">
        <Input placeholder="Search products…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
      </form>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-ink-soft">
            <Spinner className="h-5 w-5" />
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Could not load the catalog"} onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState title="Nothing listed yet" hint="Check back once admin has stock available." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} sellerAccountId={sellerAccountId} />
            ))}
          </div>
        )}
      </div>

      {(cursors.length > 0 || meta?.hasMore) && items.length > 0 && (
        <div className="mt-6 flex justify-center gap-3">
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

function ProductCard({
  item,
  sellerAccountId,
}: {
  item: NonNullable<ReturnType<typeof useStorefront>["data"]>["data"]["items"][number];
  sellerAccountId: string;
}) {
  const addToCart = useAddToCart(sellerAccountId);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outOfStock = item.available <= 0;

  async function handleAdd() {
    setError(null);
    setAdded(false);
    try {
      await addToCart.mutateAsync({ variantId: item.variant.id, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to cart");
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid aspect-square place-items-center bg-canvas text-ink-soft">
        <BoxIcon className="h-8 w-8" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{item.variant.product.brand}</p>
        <p className="font-medium leading-snug">{item.variant.product.name}</p>
        <p className="text-xs text-ink-soft">{item.variant.name}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-sm font-semibold">{formatMoney(item.discountPrice ?? item.sellPrice)}</p>
          <p className={`text-xs ${outOfStock ? "text-red-600" : "text-ink-soft"}`}>
            {outOfStock ? "Out of stock" : `${item.available} available`}
          </p>
        </div>
        <Button size="sm" className="mt-2 w-full" disabled={outOfStock || addToCart.isPending} onClick={handleAdd}>
          {addToCart.isPending ? "Adding…" : added ? "Added ✓" : "Add to cart"}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z M3.5 7.5 12 12l8.5-4.5M12 12v9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
