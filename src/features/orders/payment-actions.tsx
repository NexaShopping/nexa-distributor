"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";
import { useOrderPaymentStatus } from "@/features/orders/api";
import { useCreditRepaymentPaymentStatus } from "@/features/credit/api";
import { useAuth } from "@/lib/auth-context";

export function ContinuePhonePePayment({ orderId }: { orderId: string }) {
  const query = useOrderPaymentStatus(orderId, false);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  async function continuePayment() {
    setError(null);
    const result = await query.refetch();
    if (result.error || !result.data) { setError(result.error instanceof Error ? result.error.message : "Could not verify payment"); return; }
    const payment = result.data.payment;
    if (payment.providerStatus === "PENDING" || payment.providerStatus === "CREATED") {
      if (payment.redirectUrl?.startsWith("https://")) { window.location.assign(payment.redirectUrl); return; }
      setError("PhonePe payment link is not available yet. Please try again."); return;
    }
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["order", orderId] }), queryClient.invalidateQueries({ queryKey: ["orders"] })]);
  }
  return <Card className="p-4"><p className="text-sm font-medium">PhonePe payment pending</p><p className="mt-1 text-sm text-ink-soft">Verify the latest provider status before reopening PhonePe.</p>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}<Button className="mt-3" onClick={continuePayment} disabled={query.isFetching}>{query.isFetching ? "Checking payment…" : "Check or continue payment"}</Button></Card>;
}

export function PhonePePaymentResponse({ merchantOrderId }: { merchantOrderId?: string }) {
  const router = useRouter();
  const { status, account } = useAuth();
  const orderPayment = useOrderPaymentStatus(merchantOrderId ?? "", status === "authed" && Boolean(merchantOrderId));
  const creditPayment = useCreditRepaymentPaymentStatus(account?.id ?? "", merchantOrderId ?? "", status === "authed" && Boolean(merchantOrderId));
  useEffect(() => { if (status === "anon") router.replace("/login"); }, [router, status]);
  useEffect(() => { if (orderPayment.data && merchantOrderId) router.replace(`/dashboard/orders/${merchantOrderId}`); else if (creditPayment.data && merchantOrderId) router.replace("/dashboard/credit"); }, [creditPayment.data, merchantOrderId, orderPayment.data, router]);
  if (!merchantOrderId) return <ErrorState message="The PhonePe return URL is missing the order reference." />;
  if (orderPayment.isError && creditPayment.isError) {
    const message = creditPayment.error instanceof Error
      ? creditPayment.error.message
      : orderPayment.error instanceof Error
        ? orderPayment.error.message
        : "Could not verify the PhonePe payment.";
    return <ErrorState message={message} onRetry={() => { void orderPayment.refetch(); void creditPayment.refetch(); }} />;
  }
  return <Card className="flex items-center gap-3 p-5"><Spinner className="h-5 w-5 text-brand" /><div><p className="text-sm font-medium">Verifying PhonePe payment</p><p className="text-sm text-ink-soft">Please keep this page open while the backend checks the provider result.</p></div></Card>;
}
