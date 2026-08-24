"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useStorefrontItem } from "@/features/storefront/api";
import { useAddToCart } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";

export default function CatalogProductDetailPage() {
  const params = useParams<{ id: string }>();
  const admin = usePrimaryAdmin();
  const sellerId = admin.data?.account.id ?? "";
  const query = useStorefrontItem(sellerId, params.id);
  const addToCart = useAddToCart(sellerId);
  const [quantity, setQuantity] = useState(1);
  const item = query.data?.item;

  if (admin.isLoading || query.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (admin.isError || query.isError || !item) return <ErrorState message="Could not load this catalog item." onRetry={() => query.refetch()} />;
  const media = item.variant.product.media ?? [];
  const price = item.discountPrice ?? item.sellPrice;
  return <div className="mx-auto max-w-5xl"><Link href="/dashboard/buy" className="text-sm font-medium text-brand hover:underline">← Back to Shopping</Link><div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><Card className="overflow-hidden"><div className="aspect-square bg-canvas">{media[0] ? <img src={media[0].url} alt={media[0].alt ?? item.variant.product.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-ink-soft">No image available</div>}</div></Card><div className="flex flex-col justify-center"><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Wholesale item</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{item.variant.product.name}</h1><p className="mt-2 text-sm text-ink-soft">{item.variant.name} · SKU {item.variant.sku}</p><p className="mt-5 text-sm leading-6 text-ink-soft">{item.variant.product.brand || "NexaShopping"} central supply inventory available for distributor purchase.</p><div className="mt-6 flex items-end justify-between border-y border-line py-4"><div><p className="text-xs text-ink-soft">Purchase price</p><p className="mt-1 text-2xl font-semibold">{formatMoney(price)} <span className="text-sm font-normal text-ink-soft">/ unit</span></p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.available} available</span></div><div className="mt-6 flex items-center gap-3"><div className="flex h-10 items-center rounded-lg border border-line"><button className="grid h-10 w-10 place-items-center text-lg text-ink-soft hover:bg-canvas" type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span className="w-8 text-center text-sm font-semibold">{quantity}</span><button className="grid h-10 w-10 place-items-center text-lg text-ink-soft hover:bg-canvas" type="button" disabled={quantity >= item.available} onClick={() => setQuantity((value) => Math.min(item.available, value + 1))}>+</button></div><Button className="flex-1" disabled={addToCart.isPending || item.available <= 0} onClick={() => addToCart.mutate({ variantId: item.variant.id, quantity })}>{addToCart.isPending ? "Adding…" : "Add to cart"}</Button></div></div></div></div>;
}
