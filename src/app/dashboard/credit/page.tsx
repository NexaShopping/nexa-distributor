"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { Button, Card, EmptyState, ErrorState, Input, Label, Spinner } from "@/components/ui";
import { useCreditCharges, useCreditLedger, useCreditRepayments, useCreditSummary, useStartCreditRepayment } from "@/features/credit/api";

export default function CreditPage() {
  const { account } = useAuth();
  const accountId = account?.id ?? "";
  const summary = useCreditSummary(accountId);
  const charges = useCreditCharges(accountId);
  const ledger = useCreditLedger(accountId);
  const repayments = useCreditRepayments(accountId);
  const loading = summary.isLoading || charges.isLoading || ledger.isLoading || repayments.isLoading;
  const failed = summary.isError || charges.isError || ledger.isError || repayments.isError;

  if (loading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (failed || !summary.data) return <ErrorState message="Could not load your credit account" onRetry={() => { void summary.refetch(); void charges.refetch(); void ledger.refetch(); void repayments.refetch(); }} />;

  const credit = summary.data.credit;
  return (
    <div className="settings-page mx-auto max-w-5xl space-y-6">
      <div className="settings-heading"><p className="settings-eyebrow">Account settings</p><h1 className="text-xl font-semibold">Trade credit</h1><p className="mt-1 text-sm text-ink-soft">Track your balance, due charges, and repayments.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Available credit" value={formatMoney(credit.availableCredit)} />
        <Metric label="Outstanding balance" value={formatMoney(credit.currentBalance)} />
        <Metric label="Credit limit" value={formatMoney(credit.creditLimit)} />
        <Metric label="Next due" value={credit.nextDueAt ? new Date(credit.nextDueAt).toLocaleDateString("en-IN") : "No active due"} danger={credit.hasOverdueCharges} />
      </div>
      <RepaymentCard accountId={accountId} currentBalance={credit.currentBalance} disabled={credit.status !== "ACTIVE" || credit.currentBalance === "0.00"} />
      <section><h2 className="text-base font-semibold">Outstanding charges</h2><Card className="mt-3 overflow-hidden"><ChargeTable charges={charges.data?.charges ?? []} /></Card></section>
      <section><h2 className="text-base font-semibold">Repayment history</h2><Card className="mt-3 overflow-hidden"><RepaymentTable repayments={repayments.data?.repayments ?? []} /></Card></section>
      <section><h2 className="text-base font-semibold">Credit ledger</h2><Card className="mt-3 overflow-hidden"><LedgerTable entries={ledger.data?.entries ?? []} /></Card></section>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <Card className="settings-metric p-4"><p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p><p className={`mt-2 text-lg font-semibold ${danger ? "text-red-600" : ""}`}>{value}</p></Card>;
}

function RepaymentCard({ accountId, currentBalance, disabled }: { accountId: string; currentBalance: string; disabled: boolean }) {
  const [amount, setAmount] = useState(currentBalance);
  const [error, setError] = useState<string | null>(null);
  const repayment = useStartCreditRepayment(accountId);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try {
      const result = await repayment.mutateAsync(amount);
      if (result.payment.redirectUrl) window.location.assign(result.payment.redirectUrl);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Could not start repayment"); }
  }
  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Repay credit</h2><p className="mt-1 text-sm text-ink-soft">Pay securely with PhonePe. You can repay any amount up to your outstanding balance.</p></div><span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">PhonePe</span></div><form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3"><div className="w-48"><Label>Amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" disabled={disabled || repayment.isPending} /></div><Button type="submit" disabled={disabled || repayment.isPending || !amount}>{repayment.isPending ? "Opening PhonePe…" : "Pay now"}</Button></form>{disabled && <p className="mt-2 text-xs text-ink-soft">There is no payable balance or your credit account is suspended.</p>}{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</Card>;
}

function ChargeTable({ charges }: { charges: Array<{ id: string; orderId: string; principalAmount: string; outstandingAmount: string; dueAt: string; status: string }> }) {
  if (!charges.length) return <EmptyState title="No credit charges" hint="Credit used for direct purchases will appear here." />;
  return <div className="divide-y divide-line">{charges.map((charge) => <div key={charge.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-4"><span className="font-mono text-xs text-ink-soft">{charge.orderId.slice(0, 8)}</span><span>Principal {formatMoney(charge.principalAmount)}</span><span>Due {new Date(charge.dueAt).toLocaleDateString("en-IN")} · {charge.status}</span><strong className="sm:text-right">{formatMoney(charge.outstandingAmount)}</strong></div>)}</div>;
}

function RepaymentTable({ repayments }: { repayments: Array<{ id: string; amount: string; method: string; status: string; createdAt: string }> }) {
  if (!repayments.length) return <EmptyState title="No repayments yet" hint="Your PhonePe repayments will appear here." />;
  return <div className="divide-y divide-line">{repayments.map((repayment) => <div key={repayment.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>{new Date(repayment.createdAt).toLocaleDateString("en-IN")} · {repayment.method}</span><span className="font-medium">{formatMoney(repayment.amount)} · {repayment.status}</span></div>)}</div>;
}

function LedgerTable({ entries }: { entries: Array<{ id: string; direction: string; reason: string; amount: string; balanceAfter: string; createdAt: string }> }) {
  if (!entries.length) return <EmptyState title="No ledger activity" hint="Credit movements will appear here." />;
  return <div className="divide-y divide-line">{entries.map((entry) => <div key={entry.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-3"><span>{new Date(entry.createdAt).toLocaleDateString("en-IN")} · {entry.reason}</span><span className={entry.direction === "DEBIT" ? "text-red-600" : "text-green-700"}>{entry.direction === "DEBIT" ? "−" : "+"}{formatMoney(entry.amount)}</span><span className="sm:text-right">Balance {formatMoney(entry.balanceAfter)}</span></div>)}</div>;
}
