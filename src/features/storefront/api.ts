import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StockItemView } from "@/lib/types";

// Browsing a seller's listed stock — GET /inventory?sellerAccountId= (API.md's "storefront"
// mode). Read-only from here; adding to cart is a separate mutation in features/cart.

export interface StorefrontFilters {
  sellerAccountId: string;
  q?: string;
  category?: string;
  availability?: "in_stock" | "low_stock" | "out_of_stock";
  minPrice?: string;
  maxPrice?: string;
  sort?: "popular" | "price_asc" | "price_desc" | "newest";
}

function queryString(filters: StorefrontFilters, cursor?: string) {
  const params = new URLSearchParams();
  params.set("sellerAccountId", filters.sellerAccountId);
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sort) params.set("sort", filters.sort);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

export function useStorefront(filters: StorefrontFilters, cursor?: string) {
  const qs = queryString(filters, cursor);
  return useQuery({
    queryKey: ["storefront", filters, cursor],
    queryFn: () => api.getPage<{ items: StockItemView[] }>(`/inventory?${qs}`),
    enabled: Boolean(filters.sellerAccountId),
    placeholderData: (prev) => prev,
  });
}

export function useStorefrontItem(sellerAccountId: string, id: string) {
  return useQuery({
    queryKey: ["storefront-item", sellerAccountId, id],
    queryFn: () => api.get<{ item: StockItemView }>(`/inventory/${id}?sellerAccountId=${encodeURIComponent(sellerAccountId)}`),
    enabled: Boolean(sellerAccountId && id),
  });
}
