import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreditCharge, CreditLedgerEntry, CreditRepayment, CreditSummary } from "@/lib/types";

const creditKey = (accountId: string) => ["credit", accountId] as const;

export function useCreditSummary(accountId: string) {
  return useQuery({
    queryKey: [...creditKey(accountId), "summary"],
    queryFn: () => api.get<{ credit: CreditSummary }>(`/credit/${accountId}`),
    enabled: Boolean(accountId),
  });
}

export function useCreditCharges(accountId: string) {
  return useQuery({
    queryKey: [...creditKey(accountId), "charges"],
    queryFn: () => api.get<{ charges: CreditCharge[] }>(`/credit/${accountId}/charges`),
    enabled: Boolean(accountId),
  });
}

export function useCreditLedger(accountId: string) {
  return useQuery({
    queryKey: [...creditKey(accountId), "ledger"],
    queryFn: () => api.get<{ entries: CreditLedgerEntry[] }>(`/credit/${accountId}/ledger`),
    enabled: Boolean(accountId),
  });
}

export function useCreditRepayments(accountId: string) {
  return useQuery({
    queryKey: [...creditKey(accountId), "repayments"],
    queryFn: () => api.get<{ repayments: CreditRepayment[] }>(`/credit/${accountId}/repayments`),
    enabled: Boolean(accountId),
  });
}

export function useStartCreditRepayment(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) => api.post<{ repayment: CreditRepayment; payment: { redirectUrl: string | null } }>(
      `/credit/${accountId}/repayments/phonepe`,
      { amount, idempotencyKey: crypto.randomUUID() },
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: creditKey(accountId) }),
  });
}

export function useCreditRepaymentPaymentStatus(accountId: string, repaymentId: string, enabled = true) {
  return useQuery({
    queryKey: [...creditKey(accountId), "repayment-payment", repaymentId],
    queryFn: () => api.get<{ payment: { merchantOrderId: string; providerStatus: string; repaymentStatus: string; redirectUrl: string | null; expiresAt: string | null; verifiedAt: string | null } }>(`/credit/${accountId}/repayments/${repaymentId}/payment-status`),
    enabled: enabled && Boolean(accountId) && Boolean(repaymentId),
    retry: false,
    staleTime: 0,
  });
}
