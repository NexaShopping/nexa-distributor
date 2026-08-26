"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpdateCustomer } from "@/features/customers/api";
import { useSales } from "@/features/orders/api";
import "./customer-detail-breadcrumb.css";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/lib/api";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import type { CustomerRelationship, DistributorCustomerStatus } from "@/lib/types";

function sourceLabel(source: CustomerRelationship["acquisitionSource"]) {
  return source ? source.toLowerCase().replaceAll("_", " ") : "Not recorded";
}

export function CustomerDetail({ relationship }: { relationship: CustomerRelationship }) {
  const update = useUpdateCustomer(relationship.id);
  const [displayName, setDisplayName] = useState(relationship.displayName ?? "");
  const [notes, setNotes] = useState(relationship.notes ?? "");
  const [status, setStatus] = useState<DistributorCustomerStatus>(relationship.status);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({ displayName: displayName || null, notes: notes || null, status });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update this customer");
    }
  }

  const name = relationship.displayName || relationship.customer.name || relationship.customer.phone || "Customer";

  return (
    <div className="customer-detail-card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{relationship.customer.phone}</p>
        </div>
        <Link href={`/dashboard/customers/${relationship.id}/sale`}>
          <Button disabled={relationship.status !== "ACTIVE"}>Start sale</Button>
        </Link>
      </div>

      <Card className="grid gap-4 p-5 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-soft">Acquisition source</p>
          <p className="mt-1 capitalize">{sourceLabel(relationship.acquisitionSource)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Acquired</p>
          <p className="mt-1">{relationship.acquiredAt ? new Date(relationship.acquiredAt).toLocaleString() : "Not recorded"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Relationship created</p>
          <p className="mt-1">{new Date(relationship.createdAt).toLocaleString()}</p>
        </div>
        <p className="sm:col-span-3 text-xs text-ink-soft">Acquisition details are permanent and cannot be edited.</p>
      </Card>

      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <h2 className="text-sm font-semibold">Your private customer details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </div>
            <div>
              <Label>Relationship status</Label>
              <Select value={status} onChange={(event) => setStatus(event.target.value as DistributorCustomerStatus)}>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Private notes</Label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not recorded";
}

function DetailIcon({ name }: { name: "cart" | "phone" | "calendar" | "clock" }) {
  const paths = {
    cart: <><circle cx="9" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H6" /></>,
    phone: <path d="M6.5 3.8 9 3l1.6 4-1.8 1.4a13 13 0 0 0 5.8 5.8l1.4-1.8 4 1.6-.8 2.5a2 2 0 0 1-2.2 1.4C10.6 16.8 7.2 13.4 6 6a2 2 0 0 1 .5-2.2Z" />,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function CustomerDetailModern({ relationship }: { relationship: CustomerRelationship }) {
  const update = useUpdateCustomer(relationship.id);
  const sales = useSales({});
  const [displayName, setDisplayName] = useState(relationship.displayName ?? "");
  const [notes, setNotes] = useState(relationship.notes ?? "");
  const [status, setStatus] = useState<DistributorCustomerStatus>(relationship.status);
  const [error, setError] = useState<string | null>(null);
  const name = relationship.displayName || relationship.customer.name || relationship.customer.phone || "Customer";
  const customerSales = (sales.data?.data.orders ?? []).filter((order) => order.buyerAccountId === relationship.customer.id).slice(0, 5);
  async function save(event: React.FormEvent) { event.preventDefault(); setError(null); try { await update.mutateAsync({ displayName: displayName || null, notes: notes || null, status }); } catch (caught) { setError(caught instanceof ApiError ? caught.message : "Could not update this customer"); } }
  return <div className="customer-detail-modern">
    <nav className="customer-detail-modern__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><Link href="/dashboard/customers">Customers</Link><span>›</span><strong>Customer details</strong></nav>
    <header className="customer-detail-modern__hero"><div className="customer-detail-modern__identity"><div className="customer-detail-modern__avatar">{name.slice(0, 2).toUpperCase()}</div><div><div className="customer-detail-modern__name-row"><h1>{name}</h1><span className={`customer-status customer-status--${relationship.status.toLowerCase()}`}>{relationship.status === "ACTIVE" ? "Active" : "Blocked"}</span></div><p><DetailIcon name="phone" />{relationship.customer.phone || "Phone not recorded"}</p></div></div><div className="customer-detail-modern__actions"><Link href={`/dashboard/customers/${relationship.id}/sale`}><Button disabled={relationship.status !== "ACTIVE"}><DetailIcon name="cart" />Start sale</Button></Link><Button variant="secondary" onClick={() => setStatus(status === "BLOCKED" ? "ACTIVE" : "BLOCKED")}>{status === "BLOCKED" ? "Unblock customer" : "Block customer"}</Button><button className="customer-detail-modern__more" aria-label="More actions">•••</button></div></header>
    <div className="customer-detail-modern__summary"><div><span>Status</span><strong><i className="status-dot" />{relationship.status === "ACTIVE" ? "Active" : "Blocked"}</strong></div><div><span>Acquisition source</span><strong>{sourceLabel(relationship.acquisitionSource)}</strong></div><div><span>Acquired</span><strong><DetailIcon name="calendar" />{dateLabel(relationship.acquiredAt)}</strong></div><div><span>Last activity</span><strong><DetailIcon name="clock" />2 hours ago</strong></div></div>
    <div className="customer-detail-modern__grid"><Card className="customer-detail-modern__private"><div className="customer-detail-modern__card-heading"><div><h2>Private customer details</h2><p>Only visible to you</p></div></div><form onSubmit={save}><div className="customer-detail-modern__fields"><div><Label>Display name</Label><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div><div><Label>Relationship status</Label><Select value={status} onChange={(event) => setStatus(event.target.value as DistributorCustomerStatus)}><option value="ACTIVE">Active buyer</option><option value="BLOCKED">Blocked</option></Select></div></div><div><Label>Private notes</Label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Add a note about this customer…" /></div>{error && <p className="customer-detail-modern__error">{error}</p>}<div className="customer-detail-modern__save"><Button type="submit" size="sm" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button>{update.isSuccess && <span>Saved just now</span>}</div></form></Card><Card className="customer-detail-modern__info"><div className="customer-detail-modern__card-heading"><div><h2>Customer information</h2><p>Account and attribution</p></div></div><dl><div><dt>Phone</dt><dd>{relationship.customer.phone || "Not recorded"}</dd></div><div><dt>Account status</dt><dd><span className="customer-status customer-status--active">Active</span></dd></div><div><dt>Acquisition source</dt><dd className="capitalize">{sourceLabel(relationship.acquisitionSource)}</dd></div><div><dt>Acquired date</dt><dd>{dateLabel(relationship.acquiredAt)}</dd></div><div><dt>Created date</dt><dd>{dateLabel(relationship.createdAt)}</dd></div></dl><div className="customer-detail-modern__attribution">ⓘ This customer is permanently attributed to you.</div></Card></div>
    <Card className="customer-detail-modern__sales"><div className="customer-detail-modern__sales-heading"><div><h2>Recent customer sales</h2><p>Purchases made through your assisted sales</p></div><Link href="/dashboard/sales">View all sales →</Link></div>{sales.isLoading ? <p className="customer-detail-modern__muted">Loading sales…</p> : customerSales.length === 0 ? <p className="customer-detail-modern__muted">No sales recorded for this customer yet.</p> : <div className="customer-detail-modern__sales-table"><div className="customer-detail-modern__sales-row customer-detail-modern__sales-head"><span>Order ID</span><span>Date</span><span>Items</span><span>Total</span><span>Status</span></div>{customerSales.map((order) => <Link className="customer-detail-modern__sales-row" key={order.id} href={`/dashboard/sales/${order.id}`}><strong>{order.orderNo}</strong><span>{dateLabel(order.placedAt)}</span><span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span><strong>{formatMoney(order.grandTotal)}</strong><span className={`order-status order-status--${order.status.toLowerCase()}`}>{order.status.toLowerCase().replaceAll("_", " ")}</span></Link>)}</div>}</Card>
  </div>;
}
