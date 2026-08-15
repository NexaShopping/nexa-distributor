import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderAddress, OrderStatus } from "@/lib/types";

// Typed wrappers over src/lib/api.ts + the TanStack Query hooks the orders screens use.
// A distributor is always the buyer here (buying from admin) — role=buyer is the default and
// only mode used in this repo for now. (A distributor is also a seller to their own
// customers, but that screen doesn't exist yet — see nexashopping-catalog memory.)

export interface OrderFilters {
  status?: OrderStatus;
}

export function useOrders(filters: OrderFilters, cursor?: string) {
  const params = new URLSearchParams({ role: "buyer" });
  if (filters.status) params.set("status", filters.status);
  if (cursor) params.set("cursor", cursor);
  return useQuery({
    queryKey: ["orders", filters, cursor],
    queryFn: () => api.getPage<{ orders: Order[] }>(`/orders?${params.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<{ order: Order }>(`/orders/${id}`),
    enabled: Boolean(id),
  });
}

export interface PlaceOrderBody {
  sellerAccountId: string;
  channel: "WEB";
  shippingAddress: OrderAddress;
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlaceOrderBody) => api.post<{ order: Order }>("/orders", body),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart", variables.sellerAccountId] });
    },
  });
}

export function useCancelOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => api.post<{ order: Order }>(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
    },
  });
}
