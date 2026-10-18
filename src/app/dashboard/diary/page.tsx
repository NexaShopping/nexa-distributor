"use client";

import { useRef, useState, type FormEvent } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Label, Select, Spinner } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { useDiaryCustomers, useDiaryEntries, useSubmitDiaryEntry, type DiaryCustomer, type DiaryEntryStatus } from "@/features/diary/api";
import { prepareCashEntry } from "@/features/diary/submission";

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function initialCashTime() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 16);
}

function statusTone(status: DiaryEntryStatus): "warning" | "success" | "danger" | "neutral" {
  return status === "PENDING" ? "warning" : status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "neutral";
}

export default function DiaryPage() {
  const [customerPage, setCustomerPage] = useState(1);
  const [entryPage, setEntryPage] = useState(1);
  const [entryStatus, setEntryStatus] = useState<DiaryEntryStatus | "">("");
  const [customer, setCustomer] = useState<DiaryCustomer | null>(null);
  const [amount, setAmount] = useState("");
  const [cashReceivedAt, setCashReceivedAt] = useState(initialCashTime);
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [successReference, setSuccessReference] = useState("");
  const retryKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const customers = useDiaryCustomers(customerPage);
  const entries = useDiaryEntries(entryPage, entryStatus);
  const submit = useSubmitDiaryEntry();

  function edit() {
    retryKey.current = null;
    setFormError("");
    setSuccessReference("");
  }

  function requestConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      prepareCashEntry({ customerAccountId: customer?.id ?? "", amount, cashReceivedAt, notes }, "validation");
      setFormError("");
      setConfirmOpen(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Check the entry details.");
    }
  }

  async function confirmSubmission() {
    if (!customer || inFlight.current) return;
    inFlight.current = true;
    retryKey.current ??= crypto.randomUUID();
    try {
      const result = await submit.mutateAsync({ input: { customerAccountId: customer.id, amount, cashReceivedAt, notes }, idempotencyKey: retryKey.current });
      setConfirmOpen(false);
      setSuccessReference(result.entry.referenceCode);
      setAmount("");
      setNotes("");
      setCashReceivedAt(initialCashTime());
      retryKey.current = null;
      setEntryPage(1);
      setEntryStatus("");
    } catch (error) {
      setConfirmOpen(false);
      setFormError(error instanceof Error ? error.message : "Could not submit the request. Try again.");
    } finally {
      inFlight.current = false;
    }
  }

  return <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand-strong">Cash diary</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Collection requests</h1><p className="mt-1 text-sm text-ink-soft">Record one actual cash handover per request. An admin reviews it before it appears in the customer diary.</p></div>
      <Badge tone="warning">Admin approval required</Badge>
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,430px)]">
      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-ink">Associated customers</h2><p className="mt-1 text-xs text-ink-soft">Choose an active customer for this collection.</p></div>
        <div className="p-5">
          {customers.isLoading ? <div className="flex items-center gap-2 py-8 text-sm text-ink-soft"><Spinner className="h-4 w-4" />Loading customers…</div> : customers.isError ? <ErrorState message={customers.error instanceof Error ? customers.error.message : "Could not load customers."} onRetry={() => void customers.refetch()} /> : !customers.data?.data.customers.length ? <EmptyState title="No eligible customers" hint="Only active customers associated with your account appear here." /> : <div className="grid gap-2">
            {customers.data.data.customers.map((item) => <button key={item.id} type="button" disabled={submit.isPending} onClick={() => { edit(); setCustomer(item); }} aria-pressed={customer?.id === item.id} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${customer?.id === item.id ? "border-brand bg-orange-50" : "border-line hover:bg-canvas"}`}><span className="min-w-0"><strong className="block truncate text-sm text-ink">{item.name || item.phone || "Customer"}</strong><small className="text-xs text-ink-soft">{item.phone || "No phone on file"}</small></span><span className="shrink-0 text-xs font-medium text-brand-strong">{customer?.id === item.id ? "Selected" : "Select"}</span></button>)}
          </div>}
          {(customers.data?.meta?.totalPages ?? 1) > 1 && <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft"><span>Page {customerPage} of {customers.data?.meta?.totalPages}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={customerPage === 1 || customers.isFetching} onClick={() => setCustomerPage((page) => page - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={customerPage >= (customers.data?.meta?.totalPages ?? 1) || customers.isFetching} onClick={() => setCustomerPage((page) => page + 1)}>Next</Button></div></div>}
        </div>
      </Card>

      <Card className="self-start p-5">
        <h2 className="font-semibold text-ink">New cash entry</h2><p className="mt-1 text-xs text-ink-soft">One handover, one amount, one collection date.</p>
        <form className="mt-5 grid gap-4" onSubmit={requestConfirmation}>
          <div><Label>Customer</Label><p className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink">{customer ? customer.name || customer.phone || "Customer" : "Select a customer from the list"}</p></div>
          <div><Label htmlFor="diary-amount">Amount received (INR)</Label><Input id="diary-amount" inputMode="decimal" placeholder="2000.00" value={amount} onChange={(event) => { edit(); setAmount(event.target.value); }} required /></div>
          <div><Label htmlFor="diary-date">Cash received at (IST)</Label><Input id="diary-date" type="datetime-local" value={cashReceivedAt} max={initialCashTime()} onChange={(event) => { edit(); setCashReceivedAt(event.target.value); }} required /></div>
          <div><Label htmlFor="diary-notes">Note (optional)</Label><textarea id="diary-notes" rows={3} maxLength={500} value={notes} onChange={(event) => { edit(); setNotes(event.target.value); }} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" placeholder="Cash collection details" /></div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          {successReference && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Request {successReference} submitted for admin review.</p>}
          <Button type="submit" disabled={!customer || submit.isPending}>Review request</Button>
        </form>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><div><h2 className="font-semibold text-ink">Your submissions</h2><p className="mt-1 text-xs text-ink-soft">Pending entries do not increase the customer’s approved total.</p></div><Select aria-label="Filter submissions by status" className="w-40" value={entryStatus} onChange={(event) => { setEntryStatus(event.target.value as DiaryEntryStatus | ""); setEntryPage(1); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="REVERSED">Reversed</option></Select></div>
      <div className="p-5">{entries.isLoading ? <div className="flex items-center gap-2 py-8 text-sm text-ink-soft"><Spinner className="h-4 w-4" />Loading submissions…</div> : entries.isError ? <ErrorState message={entries.error instanceof Error ? entries.error.message : "Could not load submissions."} onRetry={() => void entries.refetch()} /> : !entries.data?.data.entries.length ? <EmptyState title="No submissions yet" hint="Your cash collection requests will appear here after you submit them." /> : <div className="grid gap-3">{entries.data.data.entries.map((entry) => <div key={entry.id} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-ink">{entry.customer.name || entry.customer.phone || "Customer"}</strong><Badge tone={statusTone(entry.status)}>{entry.status.toLowerCase()}</Badge></div><p className="mt-1 text-xs text-ink-soft">Collected {DATE_FORMAT.format(new Date(entry.cashReceivedAt))} · Requested {DATE_FORMAT.format(new Date(entry.createdAt))} · {entry.referenceCode}</p>{entry.notes && <p className="mt-2 text-xs text-ink-soft">{entry.notes}</p>}{entry.reason && <p className="mt-2 text-xs text-red-700">Reason: {entry.reason}</p>}</div><strong className="text-base text-ink">{formatMoney(entry.amount)}</strong></div>)}</div>}
        {(entries.data?.meta?.totalPages ?? 1) > 1 && <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft"><span>Page {entryPage} of {entries.data?.meta?.totalPages}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={entryPage === 1 || entries.isFetching} onClick={() => setEntryPage((page) => page - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={entryPage >= (entries.data?.meta?.totalPages ?? 1) || entries.isFetching} onClick={() => setEntryPage((page) => page + 1)}>Next</Button></div></div>}
      </div>
    </Card>

    {confirmOpen && customer && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="diary-confirm-title" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl"><h2 id="diary-confirm-title" className="text-lg font-semibold text-ink">Confirm cash collection request</h2><p className="mt-2 text-sm text-ink-soft">Check this actual cash handover before sending it for admin review.</p><dl className="mt-5 grid gap-3 rounded-xl bg-canvas p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-soft">Customer</dt><dd className="text-right font-medium">{customer.name || customer.phone}</dd></div><div className="flex justify-between gap-3"><dt className="text-ink-soft">Amount</dt><dd className="font-semibold">{formatMoney(prepareCashEntry({ customerAccountId: customer.id, amount, cashReceivedAt }, "review").amount)}</dd></div><div className="flex justify-between gap-3"><dt className="text-ink-soft">Received (IST)</dt><dd className="text-right">{DATE_FORMAT.format(new Date(prepareCashEntry({ customerAccountId: customer.id, amount, cashReceivedAt }, "review").cashReceivedAt))}</dd></div></dl><p className="mt-4 text-xs text-ink-soft">Submitting creates a pending entry. It will not appear in the approved customer total until an admin approves it.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" type="button" disabled={submit.isPending} onClick={() => setConfirmOpen(false)}>Edit details</Button><Button type="button" disabled={submit.isPending} onClick={() => void confirmSubmission()}>{submit.isPending ? "Sending…" : "Send for review"}</Button></div></div></div>}
  </div>;
}
