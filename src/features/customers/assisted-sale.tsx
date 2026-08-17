"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useInventory } from "@/features/inventory/api";
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from "@/features/cart/api";
import { AssistedCheckout } from "@/features/customers/assisted-checkout";
import { Button, Card, EmptyState, ErrorState, Input, Spinner } from "@/components/ui";
import type { CartLine, CustomerRelationship, StockItemView } from "@/lib/types";

export function AssistedSale({ relationship }: { relationship: CustomerRelationship }) {
  const { account } = useAuth();
  const sellerAccountId = account?.id ?? "";
  const buyerAccountId = relationship.customer.id;
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState<string | undefined>();
  const [showCheckout, setShowCheckout] = useState(false);
  const inventory = useInventory({ isListed: true, q });
  const cartQuery = useCart(sellerAccountId, buyerAccountId);
  const items = (inventory.data?.data.items ?? []).filter((item) => item.isListed && item.available > 0);
  const cart = cartQuery.data?.cart;

  if (inventory.isLoading || cartQuery.isLoading) {
    return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  }
  if (inventory.isError || cartQuery.isError || !cart) {
    return <ErrorState message="Could not load stock or the customer cart" onRetry={() => { inventory.refetch(); cartQuery.refetch(); }} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section>
        <form
          className="mb-4 max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            setQ(searchInput || undefined);
          }}
        >
          <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search your listed stock…" />
        </form>
        {items.length === 0 ? (
          <EmptyState title="No sellable stock found" hint="List in-stock items from My inventory before starting this sale." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => <AssistedProduct key={item.id} item={item} sellerAccountId={sellerAccountId} buyerAccountId={buyerAccountId} />)}
          </div>
        )}
      </section>

      <aside>
        <Card className="p-4 lg:sticky lg:top-4">
          <h2 className="font-semibold">Cart for {relationship.displayName || relationship.customer.name || relationship.customer.phone}</h2>
          {cart.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">Add an item from your stock.</p>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {cart.items.map((line) => <AssistedCartLine key={line.id} line={line} sellerAccountId={sellerAccountId} buyerAccountId={buyerAccountId} />)}
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <Total label="Subtotal" value={cart.subtotal} />
                <Total label="Discount" value={cart.discountTotal} />
                <Total label="Tax" value={cart.taxTotal} />
                <Total label="Total" value={cart.grandTotal} bold />
              </dl>
              {!showCheckout && <Button className="mt-4 w-full" onClick={() => setShowCheckout(true)}>Enter delivery address</Button>}
            </>
          )}
        </Card>
        {showCheckout && cart.items.length > 0 && (
          <AssistedCheckout sellerAccountId={sellerAccountId} relationship={relationship} onCancel={() => setShowCheckout(false)} />
        )}
      </aside>
    </div>
  );
}

function AssistedProduct({ item, sellerAccountId, buyerAccountId }: { item: StockItemView; sellerAccountId: string; buyerAccountId: string }) {
  const add = useAddToCart(sellerAccountId, buyerAccountId);
  const [error, setError] = useState<string | null>(null);
  async function addItem() {
    setError(null);
    try {
      await add.mutateAsync({ variantId: item.variant.id, quantity: 1 });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add item");
    }
  }
  return (
    <Card className="flex flex-col p-4">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{item.variant.product.brand}</p>
      <p className="mt-1 font-medium">{item.variant.product.name}</p>
      <p className="text-xs text-ink-soft">{item.variant.name} · {item.variant.sku}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="font-semibold">{formatMoney(item.discountPrice ?? item.sellPrice)}</p>
        <p className="text-xs text-ink-soft">{item.available} available</p>
      </div>
      <Button className="mt-3" size="sm" onClick={addItem} disabled={add.isPending}>{add.isPending ? "Adding…" : "Add to customer cart"}</Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Card>
  );
}

function AssistedCartLine({ line, sellerAccountId, buyerAccountId }: { line: CartLine; sellerAccountId: string; buyerAccountId: string }) {
  const update = useUpdateCartItem(sellerAccountId, buyerAccountId);
  const remove = useRemoveCartItem(sellerAccountId, buyerAccountId);
  const overAvailable = line.quantity > line.available;
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex justify-between gap-3">
        <div><p className="text-sm font-medium">{line.name}</p><p className="font-mono text-xs text-ink-soft">{line.sku}</p></div>
        <p className="text-sm font-medium">{formatMoney(line.lineTotal)}</p>
      </div>
      {overAvailable && <p className="mt-2 text-xs text-amber-700">Only {line.available} available. Reduce the quantity.</p>}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: line.id, quantity: Math.max(1, line.quantity - 1) })} disabled={update.isPending || line.quantity <= 1}>−</Button>
          <span className="w-6 text-center text-sm">{line.quantity}</span>
          <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: line.id, quantity: line.quantity + 1 })} disabled={update.isPending || line.quantity >= line.available}>+</Button>
        </div>
        <button className="text-xs text-ink-soft hover:text-red-600" onClick={() => remove.mutate(line.id)} disabled={remove.isPending}>Remove</button>
      </div>
    </div>
  );
}

function Total({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "border-t border-line pt-2 font-semibold" : ""}`}><dt className="text-ink-soft">{label}</dt><dd>{formatMoney(value)}</dd></div>;
}
