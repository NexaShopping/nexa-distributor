"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { Button, ErrorState, Input, Select, Spinner } from "@/components/ui";
import { PhonePeMark } from "@/components/phonepe-mark";
import { useCreditCharges, useCreditLedger, useCreditRepayments, useCreditSummary, useStartCreditRepayment } from "@/features/credit/api";

type IconName = "wallet" | "chart" | "shield" | "clock" | "refresh";
function chargeStatusTone(status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "REVERSED") {
  if (status === "PAID") return "paid";
  if (status === "REVERSED") return "neutral";
  return "pending";
}

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, React.ReactNode> = {
    wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 8h16v4h-4a2 2 0 0 0 0 4h4M16 14h.01" /></>,
    chart: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>,
    shield: <><path d="M12 3.5 5 6v6c0 4.4 3 7.7 7 8.5 4-.8 7-4.1 7-8.5V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function CreditPage() {
  const { account } = useAuth();
  const accountId = account?.id ?? "";
  const summary = useCreditSummary(accountId);
  const charges = useCreditCharges(accountId);
  const ledger = useCreditLedger(accountId);
  const repayments = useCreditRepayments(accountId);
  const credit = summary.data?.credit;

  if (summary.isError && !credit) {
    return <ErrorState message="Could not load your credit account" onRetry={() => void summary.refetch()} />;
  }

  const danger = Boolean(credit?.hasOverdueCharges);
  const metricData: Array<[string, string, string, IconName, string]> = [
    ["Available credit", credit ? formatMoney(credit.availableCredit) : "—", "Ready to spend", "wallet", "orange"],
    ["Outstanding balance", credit ? formatMoney(credit.currentBalance) : "—", "Currently owed", "chart", "amber"],
    ["Credit\nlimit", credit ? formatMoney(credit.creditLimit) : "—", "Set by admin", "shield", "green"],
    ["Next due", credit ? (credit.nextDueAt ? new Date(credit.nextDueAt).toLocaleDateString("en-IN") : "No active due") : "—", danger ? "Overdue — repay to unblock orders" : "On track", "clock", danger ? "red" : "orange"],
  ];

  return (
    <section className="credit-modern" aria-label="Trade credit">
      <div className="credit-modern__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Trade credit</strong></div>

      <div className="credit-modern__metrics">
        {metricData.map(([label, value, detail, icon, tone]) => (
          <div className={`credit-modern__metric credit-modern__metric--${tone}`} key={label}>
            <div>
              <p>{label}</p>
              <strong className={tone === "red" ? "danger" : ""}>{value}</strong>
              <span className={tone === "red" ? "danger" : ""}>{detail}</span>
            </div>
            <i className={`credit-modern__metric-icon credit-modern__metric-icon--${tone}`}><Icon name={icon} /></i>
          </div>
        ))}
      </div>

      {credit && <RepaymentCard accountId={accountId} currentBalance={credit.currentBalance} disabled={credit.status !== "ACTIVE" || credit.currentBalance === "0.00"} />}

      <div className="credit-modern__section">
        <h2>Outstanding charges</h2>
        <div className="credit-modern__table-card">
          {charges.isLoading ? (
            <div className="credit-modern__loading"><Spinner className="h-5 w-5" />Loading charges…</div>
          ) : charges.isError ? (
            <div className="credit-modern__error-cell">Could not load charges</div>
          ) : !charges.data?.charges.length ? (
            <div className="credit-modern__empty">No credit charges yet. Credit used for direct purchases will appear here.</div>
          ) : (
            <div className="credit-modern__table-scroll">
              <table>
                <thead><tr><th>Order</th><th>Principal</th><th>Due</th><th>Status</th><th className="is-number">Outstanding</th></tr></thead>
                <tbody>
                  {charges.data.charges.map((charge) => (
                    <tr key={charge.id}>
                      <td><span className="credit-modern__id">{charge.orderId.slice(0, 8)}</span></td>
                      <td>{formatMoney(charge.principalAmount)}</td>
                      <td>{new Date(charge.dueAt).toLocaleDateString("en-IN")}</td>
                      <td><span className={`credit-modern__status credit-modern__status--${chargeStatusTone(charge.status)}`}>{charge.status.toLowerCase().replace("_", " ")}</span></td>
                      <td className="is-number">{formatMoney(charge.outstandingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="credit-modern__section">
        <h2>Repayment history</h2>
        <div className="credit-modern__table-card">
          {repayments.isLoading ? (
            <div className="credit-modern__loading"><Spinner className="h-5 w-5" />Loading repayments…</div>
          ) : repayments.isError ? (
            <div className="credit-modern__error-cell">Could not load repayments</div>
          ) : !repayments.data?.repayments.length ? (
            <div className="credit-modern__empty">No repayments yet. Your PhonePe repayments will appear here.</div>
          ) : (
            <div className="credit-modern__table-scroll">
              <table>
                <thead><tr><th>Date</th><th>Method</th><th>Status</th><th className="is-number">Amount</th></tr></thead>
                <tbody>
                  {repayments.data.repayments.map((repayment) => (
                    <tr key={repayment.id}>
                      <td>{new Date(repayment.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>{repayment.method}</td>
                      <td><span className={`credit-modern__status credit-modern__status--${repayment.status.toLowerCase()}`}>{repayment.status.toLowerCase()}</span></td>
                      <td className="is-number">{formatMoney(repayment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="credit-modern__section">
        <div className="credit-modern__section-head">
          <h2>Credit ledger</h2>
          <LedgerExport accountId={accountId} />
        </div>
        <div className="credit-modern__table-card">
          {ledger.isLoading ? (
            <div className="credit-modern__loading"><Spinner className="h-5 w-5" />Loading ledger…</div>
          ) : ledger.isError ? (
            <div className="credit-modern__error-cell">Could not load the ledger</div>
          ) : !ledger.data?.entries.length ? (
            <div className="credit-modern__empty">No ledger activity yet. Credit movements will appear here.</div>
          ) : (
            <div className="credit-modern__table-scroll">
              <table>
                <thead><tr><th>Date</th><th>Reason</th><th>Movement</th><th className="is-number">Balance after</th></tr></thead>
                <tbody>
                  {ledger.data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>{entry.reason}</td>
                      <td><span className={`credit-modern__direction credit-modern__direction--${entry.direction === "DEBIT" ? "debit" : "credit"}`}><i />{entry.direction === "DEBIT" ? "−" : "+"}{formatMoney(entry.amount)}</span></td>
                      <td className="is-number">{formatMoney(entry.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// A statement export for reconciliation with admin — exact period, not just "whatever's
// currently loaded" (matches the same pattern as the orders sales-register export).
function LedgerExport({ accountId }: { accountId: string }) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(todayIso);
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [exporting, setExporting] = useState(false);

  async function exportLedger() {
    if (exporting || from > to || !accountId) return;
    setExporting(true);
    try {
      const blob = await api.download(`/credit/${accountId}/ledger/export?from=${from}&to=${to}&format=${format}`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `credit-ledger-${from}-to-${to}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch { /* error already surfaced globally */ }
    finally { setExporting(false); }
  }

  return (
    <div className="credit-modern__export">
      <label>From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} aria-label="Ledger export from date" /></label>
      <label>To<input type="date" value={to} min={from} max={todayIso} onChange={(event) => setTo(event.target.value)} aria-label="Ledger export to date" /></label>
      <Select aria-label="Ledger export format" value={format} onChange={(event) => setFormat(event.target.value as "csv" | "pdf")}><option value="csv">CSV</option><option value="pdf">PDF</option></Select>
      <Button size="sm" variant="secondary" onClick={exportLedger} disabled={exporting || from > to}>{exporting ? "Exporting…" : "Export"}</Button>
    </div>
  );
}

function RepaymentCard({ accountId, currentBalance, disabled }: { accountId: string; currentBalance: string; disabled: boolean }) {
  const [amount, setAmount] = useState(currentBalance);
  const [error, setError] = useState<string | null>(null);
  const repayment = useStartCreditRepayment(accountId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await repayment.mutateAsync(amount);
      if (result.payment.redirectUrl) window.location.assign(result.payment.redirectUrl);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not start repayment");
    }
  }

  return (
    <div className="credit-modern__repay">
      <div>
        <h2>Repay credit</h2>
        <p>Pay securely with PhonePe. You can repay any amount up to your outstanding balance.</p>
      </div>
      <span className="credit-modern__repay-badge"><PhonePeMark className="h-3.5 w-auto" /></span>
      <form onSubmit={submit} className="credit-modern__repay-form">
        <div>
          <label htmlFor="repay-amount">Amount</label>
          <Input id="repay-amount" className="w-40" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" disabled={disabled || repayment.isPending} />
        </div>
        <Button type="submit" disabled={disabled || repayment.isPending || !amount}>{repayment.isPending ? "Opening PhonePe…" : "Pay now"}</Button>
        {disabled && <p className="credit-modern__repay-note">There is no payable balance or your credit account is suspended.</p>}
        {error && <p className="credit-modern__repay-error">{error}</p>}
      </form>
    </div>
  );
}
