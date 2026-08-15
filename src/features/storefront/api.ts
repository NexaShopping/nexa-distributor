import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StockItemView } from "@/lib/types";

// Browsing a seller's listed stock — GET /inventory?sellerAccountId= (API.md's "storefront"
// mode). Read-only from here; adding to cart is a separate mutation in features/cart.

export interface StorefrontFilters {
  sellerAccountId: string;
  q?: string;
}

function queryString(filters: StorefrontFilters, cursor?: string) {
  const params = new URLSearchParams();
  params.set("sellerAccountId", filters.sellerAccountId);
  if (filters.q) params.set("q", filters.q);
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
