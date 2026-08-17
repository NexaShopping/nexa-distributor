import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CartView } from "@/lib/types";

// Typed wrappers over src/lib/api.ts + the TanStack Query hooks the buy-from-admin flow uses.

function cartKey(sellerAccountId: string, buyerAccountId?: string) {
  return ["cart", sellerAccountId, buyerAccountId ?? "self"] as const;
}

export function useCart(sellerAccountId: string, buyerAccountId?: string) {
  const params = new URLSearchParams({ sellerAccountId });
  if (buyerAccountId) params.set("buyerAccountId", buyerAccountId);
  return useQuery({
    queryKey: cartKey(sellerAccountId, buyerAccountId),
    queryFn: () => api.get<{ cart: CartView }>(`/cart?${params.toString()}`),
    enabled: Boolean(sellerAccountId),
  });
}

export function useAddToCart(sellerAccountId: string, buyerAccountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { variantId: string; quantity: number }) =>
      api.post<{ cart: CartView }>("/cart/items", {
        sellerAccountId,
        ...(buyerAccountId ? { buyerAccountId } : {}),
        ...body,
      }),
    onSuccess: (result) => qc.setQueryData(cartKey(sellerAccountId, buyerAccountId), result),
  });
}

export function useUpdateCartItem(sellerAccountId: string, buyerAccountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch<{ cart: CartView }>(`/cart/items/${id}`, { quantity }),
    onSuccess: (result) => qc.setQueryData(cartKey(sellerAccountId, buyerAccountId), result),
  });
}

export function useRemoveCartItem(sellerAccountId: string, buyerAccountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ cart: CartView }>(`/cart/items/${id}`),
    onSuccess: (result) => qc.setQueryData(cartKey(sellerAccountId, buyerAccountId), result),
  });
}
