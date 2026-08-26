import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice, Order, OrderAddress, OrderCheckoutPayment, OrderPaymentStatus, OrderStatus } from "@/lib/types";

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

export function useSales(filters: OrderFilters, cursor?: string) {
  const params = new URLSearchParams({ role: "seller" });
  if (filters.status) params.set("status", filters.status);
  if (cursor) params.set("cursor", cursor);
  return useQuery({
    queryKey: ["sales", filters, cursor],
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
  channel: "WEB" | "DISTRIBUTOR_ASSISTED";
  paymentMethod?: "PHONEPE" | "CREDIT";
  buyerAccountId?: string;
  shippingAddress: OrderAddress;
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlaceOrderBody) => api.post<{ order: Order; payment?: OrderCheckoutPayment }>("/orders", body),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["cart", variables.sellerAccountId] });
    },
  });
}

export function useOrderPaymentStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ["order-payment", id],
    queryFn: () => api.get<{ payment: OrderPaymentStatus }>(`/orders/${id}/payment-status`),
    enabled: enabled && Boolean(id),
    retry: false,
    staleTime: 0,
  });
}

// Only meaningful once an order is DELIVERED — the server generates the invoice at that
// transition, so calling this earlier just 404s. Pass `enabled` from the order's own status.
export function useOrderInvoice(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["order-invoice", id],
    queryFn: () => api.get<{ invoice: Invoice }>(`/orders/${id}/invoice`),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export interface ReturnPaymentStatus {
  merchantOrderId: string;
  purpose: "CUSTOMER_ORDER" | "DISTRIBUTOR_ORDER" | "CREDIT_REPAYMENT";
  providerStatus: "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";
  redirectUrl: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
}

export function useReturnPaymentStatus(merchantOrderId: string, enabled = true) {
  return useQuery({
    queryKey: ["return-payment", merchantOrderId],
    queryFn: () => api.get<{ payment: ReturnPaymentStatus }>(`/payments/${merchantOrderId}/status`),
    enabled: enabled && Boolean(merchantOrderId),
    retry: false,
    staleTime: 0,
  });
}

export function usePlaceAssistedOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlaceOrderBody & { channel: "DISTRIBUTOR_ASSISTED"; buyerAccountId: string }) =>
      api.post<{ order: Order }>("/orders", body),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["cart", variables.sellerAccountId, variables.buyerAccountId] });
      qc.invalidateQueries({ queryKey: ["my-inventory"] });
    },
  });
}

function useSellerOrderAction(id: string, action: "confirm" | "ship" | "deliver") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ order: Order }>(`/orders/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
      if (action === "deliver") qc.invalidateQueries({ queryKey: ["my-inventory"] });
    },
  });
}

export const useConfirmOrder = (id: string) => useSellerOrderAction(id, "confirm");
export const useShipOrder = (id: string) => useSellerOrderAction(id, "ship");
export const useDeliverOrder = (id: string) => useSellerOrderAction(id, "deliver");

export function useCancelOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => api.post<{ order: Order }>(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["my-inventory"] });
    },
  });
}
