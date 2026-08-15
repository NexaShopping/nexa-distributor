import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CartView } from "@/lib/types";

// Typed wrappers over src/lib/api.ts + the TanStack Query hooks the buy-from-admin flow uses.

export function useCart(sellerAccountId: string) {
  return useQuery({
    queryKey: ["cart", sellerAccountId],
    queryFn: () => api.get<{ cart: CartView }>(`/cart?sellerAccountId=${sellerAccountId}`),
    enabled: Boolean(sellerAccountId),
  });
}

export function useAddToCart(sellerAccountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { variantId: string; quantity: number }) =>
      api.post<{ cart: CartView }>("/cart/items", { sellerAccountId, ...body }),
    onSuccess: (result) => qc.setQueryData(["cart", sellerAccountId], result),
  });
}

export function useUpdateCartItem(sellerAccountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch<{ cart: CartView }>(`/cart/items/${id}`, { quantity }),
    onSuccess: (result) => qc.setQueryData(["cart", sellerAccountId], result),
  });
}

export function useRemoveCartItem(sellerAccountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ cart: CartView }>(`/cart/items/${id}`),
    onSuccess: (result) => qc.setQueryData(["cart", sellerAccountId], result),
  });
}
