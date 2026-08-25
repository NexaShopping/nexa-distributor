"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useStorefront } from "@/features/storefront/api";
import { useAddToCart } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import type { StockItemView } from "@/lib/types";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";

type Toast = { tone: "success" | "error"; message: string } | null;
const CATEGORIES = [{ label: "All Items", value: "" }, { label: "Smart Home", value: "smart-home" }, { label: "Audio", value: "audio" }, { label: "Accessories", value: "accessories" }, { label: "Wearables", value: "wearables" }];

export default function BuyPage() {
  const admin = usePrimaryAdmin();
  const searchParams = useSearchParams();
  const sellerAccountId = admin.data?.account.id ?? "";
  const [searchInput, setSearchInput] = useState("");
  const [queryText, setQueryText] = useState<string | undefined>();
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState<"" | "in_stock" | "low_stock" | "out_of_stock">("");
  const [priceRange, setPriceRange] = useState("");
  const [sort, setSort] = useState<"popular" | "price_asc" | "price_desc" | "newest">("popular");
  const [cursors, setCursors] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const [cartCount, setCartCount] = useState(0);
  const cursor = cursors.at(-1);

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setSearchInput(query);
    setQueryText(query.trim() || undefined);
  }, [searchParams]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setCursors([]); setQueryText(searchInput.trim() || undefined); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const availabilitySelect = document.querySelector<HTMLSelectElement>('.buy-desktop-filters select[aria-label="Availability"]');
    const priceSelect = document.querySelector<HTMLSelectElement>('.buy-desktop-filters select[aria-label="Price Range"]');
    const sortSelect = document.querySelector<HTMLSelectElement>('.buy-desktop-filters select[aria-label="Sort"]');
    const onAvailability = () => { const value = availabilitySelect?.value ?? ""; setCursors([]); setAvailability(value === "In Stock" ? "in_stock" : value === "Low Stock" || value === "Pre-order" ? "low_stock" : value === "Out of Stock" ? "out_of_stock" : ""); };
    const onPrice = () => { const value = priceSelect?.value ?? ""; setCursors([]); setPriceRange(value.includes("1,000 -") ? "1000:5000" : value.includes("Above") ? "5000:" : value.includes("Under") ? "0:1000" : ""); };
    const onSort = () => { const value = sortSelect?.value ?? ""; setCursors([]); setSort(value.includes("Low") ? "price_asc" : value.includes("High") ? "price_desc" : value.includes("Newest") ? "newest" : "popular"); };
    availabilitySelect?.addEventListener("change", onAvailability);
    priceSelect?.addEventListener("change", onPrice);
    sortSelect?.addEventListener("change", onSort);
    return () => { availabilitySelect?.removeEventListener("change", onAvailability); priceSelect?.removeEventListener("change", onPrice); sortSelect?.removeEventListener("change", onSort); };
  });

  const [minPrice, maxPrice] = priceRange ? priceRange.split(":") : [undefined, undefined];
  const query = useStorefront({ sellerAccountId, q: queryText, category: category || undefined, availability: availability || undefined, minPrice, maxPrice, sort }, cursor);
  const items = query.data?.data.items ?? [];
  const meta = query.data?.meta;

  if (admin.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (admin.isError) return <ErrorState message="Could not find the NexaShopping catalog right now." onRetry={() => admin.refetch()} />;

  return <div className="buy-page">
    {toast && <div className={`login-toast ${toast.tone}`} role="status"><span>{toast.tone === "success" ? "✓" : "!"}</span>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="Dismiss">×</button></div>}
    <div className="buy-mobile-heading"><Link href="/dashboard" aria-label="Back to dashboard" className="buy-back">←</Link><h1>Buy from Admin</h1><Link href="/dashboard/cart" aria-label="Open cart" className="buy-cart">🛒{cartCount > 0 && <b>{cartCount}</b>}</Link></div>
    <div className="buy-desktop-heading"><nav className="buy-breadcrumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Buy from Admin</strong></nav><h1>Wholesale Catalog</h1><p>Browse and purchase inventory directly from Nexa central supply.</p></div>
    <div className="buy-toolbar"><label className="buy-search"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search products..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label><button type="button" className="buy-filter" aria-label="Open filters">☷<span>Filters</span></button></div>
    <div className="buy-categories" role="tablist" aria-label="Product categories">{CATEGORIES.map((item) => <button key={item.value || "all"} type="button" role="tab" aria-selected={category === item.value} className={category === item.value ? "active" : ""} onClick={() => { setCursors([]); setCategory(item.value); }}>{item.label}</button>)}</div>
    <div className="buy-desktop-filters"><select aria-label="Availability"><option>Availability</option><option>In Stock</option><option>Pre-order</option></select><select aria-label="Price Range"><option>Price Range</option><option>Under ₹1,000</option><option>₹1,000 - ₹5,000</option><option>Above ₹5,000</option></select><select aria-label="Sort"><option>Sort: Popular</option><option>Price: Low to High</option><option>Price: High to Low</option></select></div>
    <div className="buy-catalog">{query.isLoading ? <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div> : query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Could not load the catalog"} onRetry={() => query.refetch()} /> : items.length === 0 ? <EmptyState title="Nothing listed yet" hint="Check back once admin has stock available." /> : items.map((item) => <ProductCard key={item.id} item={item} sellerAccountId={sellerAccountId} onToast={setToast} onAdded={() => setCartCount((count) => count + 1)} />)}</div>
    {(cursors.length > 0 || meta?.hasMore) && items.length > 0 && <div className="buy-pagination"><button type="button" disabled={!cursors.length} onClick={() => setCursors((value) => value.slice(0, -1))}>‹</button><strong>{cursors.length + 1}</strong>{meta?.hasMore && meta.cursor && <button type="button" disabled={query.isFetching} onClick={() => setCursors((value) => [...value, meta.cursor!])}>›</button>}</div>}
  </div>;
}

function ProductCard({ item, sellerAccountId, onToast, onAdded }: { item: StockItemView; sellerAccountId: string; onToast: (toast: Toast) => void; onAdded: () => void }) {
  const addToCart = useAddToCart(sellerAccountId);
  const media = item.variant.product.media ?? [];
  const [quantity, setQuantity] = useState(1);
  const outOfStock = item.available <= 0;
  const lowStock = item.available > 0 && item.available <= 5;
  const price = item.discountPrice ?? item.sellPrice;
  async function handleAdd() {
    try { await addToCart.mutateAsync({ variantId: item.variant.id, quantity }); onAdded(); onToast({ tone: "success", message: `${item.variant.product.name} added to cart.` }); }
    catch (error) { onToast({ tone: "error", message: error instanceof ApiError ? error.message : "Could not add item to cart." }); }
  }
  const detailsHref = `/dashboard/buy/${item.id}`;
  return <article className={`buy-product-card ${outOfStock ? "out" : ""}`}><Link href={detailsHref} className="buy-product-image" aria-label={`View details for ${item.variant.product.name}`}>{media.length ? <img src={media[0].url} alt={media[0].alt ?? item.variant.product.name} /> : <div className="buy-image-placeholder">□</div>}{outOfStock ? <span className="stock-badge out">OUT OF STOCK</span> : <span className={`stock-badge ${lowStock ? "low" : "available"}`}>{lowStock ? `Low Stock (${item.available})` : `In Stock (${item.available})`}</span>}</Link><div className="buy-product-info"><div><Link href={detailsHref} className="buy-product-title"><h2>{item.variant.product.name}</h2><span>SKU: {item.variant.sku}</span></Link><p>{item.variant.name}</p></div><div className="buy-product-bottom"><div className="buy-price"><small>Purchase Price</small><strong>{formatMoney(price)} <em>/ unit</em></strong></div>{outOfStock ? <button type="button" disabled>Notify Me</button> : <div className="buy-actions"><div className="buy-quantity"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button type="button" disabled={quantity >= item.available} onClick={() => setQuantity((value) => Math.min(item.available, value + 1))}>+</button></div><button type="button" className="buy-add" disabled={addToCart.isPending} onClick={handleAdd}><span>🛒</span><b className="buy-add-label">Add</b><b className="buy-buy-label">Buy Now</b></button></div>}</div></div></article>;
}
