import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateCustomerBody,
  CustomerRelationship,
  DistributorCustomerStatus,
  UpdateCustomerBody,
} from "@/lib/types";

export interface CustomerFilters {
  q?: string;
  status?: DistributorCustomerStatus;
}

export function useCustomers(filters: CustomerFilters, cursor?: string) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return useQuery({
    queryKey: ["customers", filters, cursor],
    queryFn: () => api.getPage<{ customers: CustomerRelationship[] }>(`/customers${query ? `?${query}` : ""}`),
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<{ customer: CustomerRelationship }>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerBody) => api.post<{ customer: CustomerRelationship }>("/customers", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCustomerBody) =>
      api.patch<{ customer: CustomerRelationship }>(`/customers/${id}`, body),
    onSuccess: (result) => {
      queryClient.setQueryData(["customer", id], result);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
