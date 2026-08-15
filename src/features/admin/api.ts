import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AccountSummary } from "@/lib/types";

// Who to buy central stock from (API.md · GET /accounts/admin). Cached hard — this basically
// never changes within a session.
export function usePrimaryAdmin() {
  return useQuery({
    queryKey: ["primary-admin"],
    queryFn: () => api.get<{ account: AccountSummary }>("/accounts/admin"),
    staleTime: Infinity,
  });
}
