import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DistributorPayable, DistributorPayout } from "@/lib/types";

export function useMyPayables() {
  return useQuery({
    queryKey: ["settlements", "mine"],
    queryFn: () => api.get<{ payables: DistributorPayable[] }>("/settlements"),
  });
}

export function useMyPayouts() {
  return useQuery({
    queryKey: ["settlements", "payouts"],
    queryFn: () => api.get<{ payouts: DistributorPayout[] }>("/settlements/payouts"),
  });
}
