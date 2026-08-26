"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "flowbite-react-icons/outline";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from "@/features/cart/api";
import { useStorefront } from "@/features/storefront/api";
import { usePlaceOrder } from "@/features/orders/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { Button, Card, EmptyState, ErrorState, Input, Label, Spinner } from "@/components/ui";
import type { OrderAddress } from "@/lib/types";
import "./cart-modern.css";
import "./cart-modern-overrides.css";
import "./cart-modern-final.css";
import "./cart-modern-grid-fix.css";
import "./cart-checkout.css";

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
  const recommendations = useStorefront({ sellerAccountId, sort: "popular" });
  const recommendedItems = (recommendations.data?.data.items ?? []).filter((item) => !cart?.items.some((line) => line.variantId === item.variant.id)).slice(0, 4);
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
    <div className="cart-modern">
      <nav className="flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link><span>›</span><strong className="font-medium text-ink">Cart</strong>
      </nav>

      {cart.items.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="Your cart is empty" hint="Add something from the catalog to get started." />
        </div>
      ) : (
        <>
          <div className="cart-modern__grid"><Card className="cart-modern__items"><div className="cart-modern__section-head"><div><h1>Your cart</h1><p>{cart.items.length} wholesale items selected</p></div><Link href="/dashboard/buy">Continue shopping</Link></div><div className="cart-modern__line-list">{cart.items.map((line) => <CartLineRow key={line.id} line={line} sellerAccountId={sellerAccountId} />)}</div></Card>
          <Card className="cart-modern__summary">
            <div className="cart-modern__section-head"><div><h2>Order summary</h2><p>Wholesale checkout</p></div></div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={cart.subtotal} />
              <Row label="Discount" value={cart.discountTotal} />
              <Row label="Tax" value={cart.taxTotal} />
              <Row label="Shipping" value={cart.shippingTotal} />
              <div className="mt-2 border-t border-line pt-2">
                <Row label="Total" value={cart.grandTotal} bold />
              </div>
            </dl>
            <div className="cart-modern__secure">Secure checkout · Your payment details are protected.</div>

          <Button className="cart-modern__checkout" onClick={() => setShowCheckout(true)}>Proceed to checkout</Button></Card></div>
          {showCheckout && <CheckoutForm sellerAccountId={sellerAccountId} onCancel={() => setShowCheckout(false)} />}
          <RecommendedProducts items={recommendedItems} sellerAccountId={sellerAccountId} loading={recommendations.isLoading} />
        </>
      )}
      {cart.items.length === 0 && <RecommendedProducts items={recommendedItems} sellerAccountId={sellerAccountId} loading={recommendations.isLoading} />}
    </div>
  );
}

function RecommendedProducts({ items, sellerAccountId, loading }: { items: import("@/lib/types").StockItemView[]; sellerAccountId: string; loading: boolean }) {
  return <section className="cart-modern__recommendations"><div className="cart-modern__section-head"><div><h2>Recommended for you</h2><p>Popular stock other distributors are adding</p></div><Link href="/dashboard/buy">View all <ArrowRight /></Link></div>{loading ? <div className="cart-modern__recommendation-loading"><Spinner className="h-4 w-4" /> Loading recommendations</div> : items.length ? <div className="cart-modern__recommendation-grid">{items.map((item) => <RecommendedCard key={item.id} item={item} sellerAccountId={sellerAccountId} />)}</div> : <p className="cart-modern__muted">No recommendations available right now.</p>}</section>;
}
function RecommendedCard({ item, sellerAccountId }: { item: import("@/lib/types").StockItemView; sellerAccountId: string }) {
  const add = useAddToCart(sellerAccountId); const media = item.variant.product.media?.[0]; const price = item.discountPrice ?? item.sellPrice;
  return <article className="cart-modern__recommendation"><Link href={`/dashboard/buy/${item.id}`} className="cart-modern__recommendation-image">{media ? <img src={media.url} alt={media.alt ?? item.variant.product.name} /> : <span>{item.variant.product.name.charAt(0)}</span>}</Link><div className="cart-modern__recommendation-copy"><strong>{item.variant.product.name}</strong><small>SKU: {item.variant.sku}</small><b>{formatMoney(price)}</b></div><Button size="sm" disabled={add.isPending || item.available <= 0} onClick={() => add.mutate({ variantId: item.variant.id, quantity: 1 })}>Add</Button></article>;
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
    <Card className="cart-modern__row">
      <div className="cart-modern__thumb" aria-hidden="true"><span>{line.name.charAt(0)}</span></div><div className="cart-modern__row-copy">
        <p className="font-medium">{line.name}</p>
        <p className="font-mono text-xs text-ink-soft">{line.sku}</p>
        {overAvailable && (
          <p className="mt-1 text-xs text-amber-700">Only {line.available} in stock — reduce quantity before checkout.</p>
        )}
      </div>
      <div className="cart-modern__stepper">
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
      <p className="cart-modern__row-price"><strong>{formatMoney(line.lineTotal)}</strong><small>{formatMoney(line.unitPrice)} / unit</small></p>
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
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PHONEPE" | "CREDIT">("COD");
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
      const result = await place.mutateAsync({ sellerAccountId, channel: "WEB", ...(paymentMethod === "COD" ? {} : { paymentMethod }), shippingAddress: address });
      if (result.payment?.redirectUrl) {
        window.location.assign(result.payment.redirectUrl);
        return;
      }
      router.push(`/dashboard/orders/${result.order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place the order");
    }
  }

  const canSubmit = address.contactName && address.contactPhone && address.line1 && address.city && address.state && address.pincode;

  return (
    <Card className="cart-modern__checkout-card mt-5 space-y-4 p-5">
      <div><p className="text-sm font-semibold">Shipping & payment</p><p className="mt-1 text-xs text-ink-soft">Enter delivery details and choose how you want to pay.</p></div>
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
        <div className="sm:col-span-2"><Label>Payment method</Label><div className="cart-modern__payment-options"><label className={paymentMethod === "COD" ? "is-selected" : ""}><input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /><span>Cash on delivery</span><small>Pay when your order arrives</small></label><label className={paymentMethod === "PHONEPE" ? "is-selected" : ""}><input type="radio" name="payment" value="PHONEPE" checked={paymentMethod === "PHONEPE"} onChange={() => setPaymentMethod("PHONEPE")} /><span><i className="cart-modern__phonepe">पे</i>PhonePe</span><small>Fast, secure online payment</small></label><label className={paymentMethod === "CREDIT" ? "is-selected" : ""}><input type="radio" name="payment" value="CREDIT" checked={paymentMethod === "CREDIT"} onChange={() => setPaymentMethod("CREDIT")} /><span><i className="cart-modern__credit-logo">N</i>Nexa Credit</span><small>Use your available trade credit</small></label></div>
          {paymentMethod === "CREDIT" && <p className="mt-1 text-xs text-ink-soft">The order uses your available trade-credit balance and is due according to your credit terms.</p>}
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
