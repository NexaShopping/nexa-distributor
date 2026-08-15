"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/features/cart/api";
import { usePlaceOrder } from "@/features/orders/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { Button, Card, EmptyState, ErrorState, Input, Label, Spinner } from "@/components/ui";
import type { OrderAddress } from "@/lib/types";

const EMPTY_ADDRESS: OrderAddress = {
  contactName: "",
  contactPhone: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CartPage() {
  const admin = usePrimaryAdmin();
  const sellerAccountId = admin.data?.account.id ?? "";
  const { data, isLoading, isError, refetch } = useCart(sellerAccountId);
  const cart = data?.cart;
  const [showCheckout, setShowCheckout] = useState(false);

  if (admin.isLoading || isLoading) {
    return (
      <div className="grid place-items-center py-20 text-ink-soft">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }
  if (admin.isError || isError || !cart) {
    return <ErrorState message="Could not load your cart" onRetry={refetch} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold">Your cart</h1>

      {cart.items.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="Your cart is empty" hint="Add something from the catalog to get started." />
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {cart.items.map((line) => (
              <CartLineRow key={line.id} line={line} sellerAccountId={sellerAccountId} />
            ))}
          </div>

          <Card className="mt-5 p-4">
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={cart.subtotal} />
              <Row label="Discount" value={cart.discountTotal} />
              <Row label="Tax" value={cart.taxTotal} />
              <Row label="Shipping" value={cart.shippingTotal} />
              <div className="mt-2 border-t border-line pt-2">
                <Row label="Total" value={cart.grandTotal} bold />
              </div>
            </dl>
          </Card>

          {!showCheckout ? (
            <Button className="mt-5 w-full" onClick={() => setShowCheckout(true)}>
              Proceed to checkout
            </Button>
          ) : (
            <CheckoutForm sellerAccountId={sellerAccountId} onCancel={() => setShowCheckout(false)} />
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}>
      <dt className="text-ink-soft">{label}</dt>
      <dd>{formatMoney(value)}</dd>
    </div>
  );
}

function CartLineRow({
  line,
  sellerAccountId,
}: {
  line: NonNullable<ReturnType<typeof useCart>["data"]>["cart"]["items"][number];
  sellerAccountId: string;
}) {
  const update = useUpdateCartItem(sellerAccountId);
  const remove = useRemoveCartItem(sellerAccountId);
  const overAvailable = line.quantity > line.available;

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{line.name}</p>
        <p className="font-mono text-xs text-ink-soft">{line.sku}</p>
        {overAvailable && (
          <p className="mt-1 text-xs text-amber-700">Only {line.available} in stock — reduce quantity before checkout.</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => update.mutate({ id: line.id, quantity: Math.max(1, line.quantity - 1) })}
          disabled={update.isPending || line.quantity <= 1}
          className="grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-canvas disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
        <button
          type="button"
          onClick={() => update.mutate({ id: line.id, quantity: line.quantity + 1 })}
          disabled={update.isPending}
          className="grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-canvas"
        >
          +
        </button>
      </div>
      <p className="w-24 text-right text-sm font-medium">{formatMoney(line.lineTotal)}</p>
      <button
        type="button"
        onClick={() => remove.mutate(line.id)}
        disabled={remove.isPending}
        className="text-sm text-ink-soft hover:text-red-600"
      >
        Remove
      </button>
    </Card>
  );
}

function CheckoutForm({ sellerAccountId, onCancel }: { sellerAccountId: string; onCancel: () => void }) {
  const router = useRouter();
  const place = usePlaceOrder();
  const [address, setAddress] = useState<OrderAddress>(EMPTY_ADDRESS);
  const [error, setError] = useState<string | null>(null);

  function field<K extends keyof OrderAddress>(key: K) {
    return {
      value: address[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [key]: e.target.value })),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { order } = await place.mutateAsync({ sellerAccountId, channel: "WEB", shippingAddress: address });
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place the order");
    }
  }

  const canSubmit = address.contactName && address.contactPhone && address.line1 && address.city && address.state && address.pincode;

  return (
    <Card className="mt-5 space-y-4 p-5">
      <p className="text-sm font-medium">Shipping address</p>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Contact name</Label>
          <Input {...field("contactName")} required />
        </div>
        <div>
          <Label>Contact phone</Label>
          <Input {...field("contactPhone")} placeholder="+919812345678" required />
        </div>
        <div className="sm:col-span-2">
          <Label>Address line 1</Label>
          <Input {...field("line1")} required />
        </div>
        <div>
          <Label>City</Label>
          <Input {...field("city")} required />
        </div>
        <div>
          <Label>State</Label>
          <Input {...field("state")} required />
        </div>
        <div>
          <Label>Pincode</Label>
          <Input {...field("pincode")} required />
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={!canSubmit || place.isPending}>
            {place.isPending ? "Placing order…" : "Place order"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Back to cart
          </Button>
        </div>
      </form>
    </Card>
  );
}
