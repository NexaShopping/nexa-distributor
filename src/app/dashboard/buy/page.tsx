"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CartPlus } from "flowbite-react-icons/outline";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useStorefront } from "@/features/storefront/api";
import { useCatalogCategories } from "@/features/catalog/api";
import { useAddToCart } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import type { StockItemView } from "@/lib/types";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";

type Toast = { tone: "success" | "error"; message: string } | null;
export default function BuyPage() {
  const admin = usePrimaryAdmin();
  const categoriesQuery = useCatalogCategories();
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
  const [minPrice, maxPrice] = priceRange ? priceRange.split(":") : [undefined, undefined];
  const query = useStorefront({ sellerAccountId, q: queryText, category: category || undefined, availability: availability || undefined, minPrice, maxPrice, sort }, cursor);
  const items = query.data?.data.items ?? [];
  const meta = query.data?.meta;
  const categories = [{ label: "All Items", value: "" }, ...(categoriesQuery.data?.categories ?? []).map((item) => ({ label: item.name, value: item.slug }))];

  if (admin.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (admin.isError) return <ErrorState message="Could not find the NexaShopping catalog right now." onRetry={() => admin.refetch()} />;

  return <div className="buy-page">
    <div className="buy-stitch-controls" aria-label="Catalog filters"><div className="buy-stitch-filter-heading"><span>{query.isFetching ? "Updating catalog…" : `Showing ${items.length} products`}</span>{(category || availability || priceRange || sort !== "popular") && <button type="button" onClick={() => { setCursors([]); setCategory(""); setAvailability(""); setPriceRange(""); setSort("popular"); }}>Clear filters</button>}</div><div className="buy-stitch-filter-row"><select aria-label="Availability" value={availability} onChange={(event) => { setCursors([]); setAvailability(event.target.value as typeof availability); }}><option value="">Availability</option><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select><select aria-label="Price Range" value={priceRange} onChange={(event) => { setCursors([]); setPriceRange(event.target.value); }}><option value="">Price Range</option><option value="0:1000">Under 1,000</option><option value="1000:5000">1,000 - 5,000</option><option value="5000:">Above 5,000</option></select><select aria-label="Sort" value={sort} onChange={(event) => { setCursors([]); setSort(event.target.value as typeof sort); }}><option value="popular">Sort: Popular</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="newest">Newest</option></select></div></div>
    {toast && <div className={`login-toast ${toast.tone}`} role="status"><span>{toast.tone === "success" ? "✓" : "!"}</span>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="Dismiss">×</button></div>}
    <div className="buy-mobile-heading"><Link href="/dashboard" aria-label="Back to dashboard" className="buy-back">←</Link><h1>Buy from Admin</h1><Link href="/dashboard/cart" aria-label="Open cart" className="buy-cart">🛒{cartCount > 0 && <b>{cartCount}</b>}</Link></div>
    <div className="buy-desktop-heading"><nav className="buy-breadcrumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Shopping</strong></nav></div>
    <div className="buy-toolbar"><label className="buy-search"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search products..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label><button type="button" className="buy-filter" aria-label="Open filters">☷<span>Filters</span></button></div>
    <div className="buy-categories" role="tablist" aria-label="Product categories">{categories.map((item) => <button key={item.value || "all"} type="button" role="tab" aria-selected={category === item.value} className={category === item.value ? "active" : ""} onClick={() => { setCursors([]); setCategory(item.value); }}>{item.label}</button>)}</div>
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
  return <article className={`buy-product-card ${outOfStock ? "out" : ""}`}><Link href={detailsHref} className="buy-product-image" aria-label={`View details for ${item.variant.product.name}`}>{media.length ? <img src={media[0].url} alt={media[0].alt ?? item.variant.product.name} /> : <div className="buy-image-placeholder">□</div>}{outOfStock ? <span className="stock-badge out">OUT OF STOCK</span> : <span className={`stock-badge ${lowStock ? "low" : "available"}`}>{lowStock ? `Low Stock (${item.available})` : `In Stock (${item.available})`}</span>}</Link><div className="buy-product-info"><div><Link href={detailsHref} className="buy-product-title"><h2>{item.variant.product.name}</h2><span>SKU: {item.variant.sku}</span></Link><p>{item.variant.name}</p></div><div className="buy-product-bottom"><div className="buy-price"><small>Purchase Price</small><strong>{formatMoney(price)} <em>/ unit</em></strong></div>{outOfStock ? <button type="button" disabled>Notify Me</button> : <div className="buy-actions"><div className="buy-quantity"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button type="button" disabled={quantity >= item.available} onClick={() => setQuantity((value) => Math.min(item.available, value + 1))}>+</button></div><button type="button" className="buy-add" disabled={addToCart.isPending} onClick={handleAdd}><CartPlus className="h-4 w-4" /><b className="buy-add-label">Add</b><b className="buy-buy-label">Buy Now</b></button></div>}</div></div></article>;
}
