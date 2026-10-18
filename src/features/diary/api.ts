import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CashEntryInput } from "./submission";
import { prepareCashEntry } from "./submission";

export interface DiaryCustomer {
  id: string;
  name: string | null;
  phone: string | null;
  status: string;
}

export type DiaryEntryStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";

export interface DiaryEntry {
  id: string;
  referenceCode: string;
  customer: { id: string; name: string | null; phone: string | null };
  amount: string;
  currency: "INR";
  cashReceivedAt: string;
  createdAt: string;
  status: DiaryEntryStatus;
  notes: string | null;
  reason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export function useDiaryCustomers(page: number) {
  return useQuery({
    queryKey: ["diary", "customers", page],
    queryFn: () => api.getPage<{ customers: DiaryCustomer[] }>(`/diary/distributor/customers?page=${page}&limit=20`),
    placeholderData: (previous) => previous,
  });
}

export function useDiaryEntries(page: number, status: DiaryEntryStatus | "") {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return useQuery({
    queryKey: ["diary", "entries", page, status],
    queryFn: () => api.getPage<{ entries: DiaryEntry[] }>(`/diary/distributor/entries?${params}`),
    placeholderData: (previous) => previous,
  });
}

export function useSubmitDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CashEntryInput; idempotencyKey: string }) =>
      api.post<{ entry: DiaryEntry }>("/diary/distributor/entries", prepareCashEntry(input, idempotencyKey)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diary", "entries"] }),
  });
}
