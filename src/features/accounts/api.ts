import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AccountSummary } from "@/lib/types";

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => api.get<{ account: AccountSummary }>(`/accounts/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; avatarUrl?: string | null }) => api.patch<{ account: AccountSummary }>(`/accounts/${id}`, input),
    onSuccess: (result) => {
      queryClient.setQueryData(["account", id], result);
      queryClient.invalidateQueries({ queryKey: ["account", id] });
    },
  });
}
