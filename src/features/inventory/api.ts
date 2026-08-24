import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdjustStockBody,
  RetailPriceRange,
  StockItemView,
  StockLedgerEntry,
  UpdateStockItemBody,
} from "@/lib/types";

// Typed wrappers over src/lib/api.ts + the TanStack Query hooks "my inventory" uses.
// No receive/transfer here — a distributor's stock only arrives by buying from admin
// (features/orders + features/cart); this screen is pricing/adjusting/viewing what they hold.

export interface InventoryFilters {
  isListed?: boolean;
  lowStock?: boolean;
  q?: string;
}

function inventoryQueryString(filters: InventoryFilters, cursor?: string) {
  const params = new URLSearchParams();
  if (filters.isListed !== undefined) params.set("isListed", String(filters.isListed));
  if (filters.lowStock) params.set("lowStock", "true");
  if (filters.q) params.set("q", filters.q);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

export function useInventory(filters: InventoryFilters, cursor?: string) {
  const qs = inventoryQueryString(filters, cursor);
  return useQuery({
    queryKey: ["my-inventory", filters, cursor],
    queryFn: () => api.getPage<{ items: StockItemView[] }>(`/inventory${qs ? `?${qs}` : ""}`),
    placeholderData: (prev) => prev,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["my-inventory-item", id],
    queryFn: () => api.get<{ item: StockItemView }>(`/inventory/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateStockItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStockItemBody) => api.patch<{ item: StockItemView }>(`/inventory/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-inventory"] }),
  });
}

export function useRetailPriceRange(id: string) {
  return useQuery({
    queryKey: ["retail-price-range", id],
    queryFn: () => api.get<{ range: RetailPriceRange }>(`/inventory/${id}/retail-range`),
    enabled: Boolean(id),
  });
}

export function useAdjustStock(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdjustStockBody) => api.post<{ item: StockItemView }>(`/inventory/${id}/adjust`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-inventory"] }),
  });
}

export function useLedger(id: string, cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return useQuery({
    queryKey: ["ledger", id, cursor],
    queryFn: () => api.getPage<{ entries: StockLedgerEntry[] }>(`/inventory/${id}/ledger${qs}`),
    enabled: Boolean(id),
  });
}
