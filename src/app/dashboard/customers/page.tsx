"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CustomerForm } from "@/features/customers/customer-form";
import { useCustomers, type CustomerFilters } from "@/features/customers/api";
import { Button, EmptyState, ErrorState, Input, Select, Spinner } from "@/components/ui";
import type { DistributorCustomerStatus } from "@/lib/types";

function LegacyCustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const searchParams = useSearchParams();
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(filters, cursor);
  const customers = data?.data.customers ?? [];
  const meta = data?.meta;

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) setSearchInput(query);
    if (query) setFilters((current) => ({ ...current, q: query }));
  }, [searchParams]);

  function updateFilters(next: Partial<CustomerFilters>) {
    setCursors([]);
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="customers-page mx-auto max-w-5xl">
      <div className="customers-heading flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-ink-soft">
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link><span>›</span><strong className="font-medium text-ink">Customers</strong>
        </nav>
        <Button onClick={() => setShowForm((shown) => !shown)}>{showForm ? "Close form" : "Add customer"}</Button>
      </div>

      {showForm && <div className="mt-5"><CustomerForm onCancel={() => setShowForm(false)} /></div>}

      <div className="customers-filters mt-5 flex flex-col gap-3 sm:flex-row">
        <form
          className="flex-1 sm:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({ q: searchInput || undefined });
          }}
        >
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or phone…"
          />
        </form>
        <Select
          className="sm:w-44"
          value={filters.status ?? ""}
          onChange={(event) => updateFilters({ status: (event.target.value || undefined) as DistributorCustomerStatus | undefined })}
        >
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </Select>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Could not load customers"} onRetry={refetch} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" hint="Add a customer by phone, or change the current filters." />
        ) : (
          <div className="customers-table overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Acquisition</th>
                  <th className="px-4 py-2.5 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {customers.map((relationship) => (
                  <tr key={relationship.id} className="hover:bg-canvas">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/customers/${relationship.id}`} className="font-medium text-brand hover:underline">
                        {relationship.displayName || relationship.customer.name || relationship.customer.phone}
                      </Link>
                      <p className="text-xs text-ink-soft">{relationship.customer.phone}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${relationship.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                        {relationship.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-ink-soft">
                      {relationship.acquisitionSource?.toLowerCase().replaceAll("_", " ") ?? "Not recorded"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-ink-soft">{new Date(relationship.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(cursors.length > 0 || meta?.hasMore) && customers.length > 0 && (
        <div className="mt-4 flex justify-center gap-3">
          {cursors.length > 0 && <Button variant="secondary" size="sm" onClick={() => setCursors((current) => current.slice(0, -1))}>Previous</Button>}
          {meta?.hasMore && meta.cursor && (
            <Button variant="secondary" size="sm" disabled={isFetching} onClick={() => setCursors((current) => [...current, meta.cursor!])}>
              {isFetching ? "Loading…" : "Next"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

type CustomerIconName = "search" | "plus" | "users" | "check" | "ban" | "refresh" | "arrow" | "more";

function CustomerIcon({ name, className = "h-4 w-4" }: { name: CustomerIconName; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="3" /><path d="M16 11a3 3 0 1 0 0-6M17 14.5h1a3 3 0 0 1 3 3V20" /></>,
    check: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    ban: <><circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14M21 19v-5h-5" /></>,
    arrow: <path d="m9 5 7 7-7 7" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function customerDisplayName(relationship: { displayName: string | null; customer: { name: string | null; phone: string | null } }) {
  return relationship.displayName || relationship.customer.name || relationship.customer.phone || "Customer";
}

function customerInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
}

function customerSourceLabel(source: string | null) {
  return source ? source.toLowerCase().replaceAll("_", " ") : "Not recorded";
}

function customerActivityDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function CustomerStatusBadge({ status }: { status: DistributorCustomerStatus }) {
  return <span className={`customers-modern__status customers-modern__status--${status.toLowerCase()}`}><i />{status.toLowerCase()}</span>;
}

function CustomerMetric({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: CustomerIconName; tone: string }) {
  return <div className={`customers-modern__metric customers-modern__metric--${tone}`}><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><i className={`customers-modern__metric-icon customers-modern__metric-icon--${tone}`}><CustomerIcon name={icon} /></i></div>;
}

export default function CustomersModernPage() {
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const searchParams = useSearchParams();
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(filters, cursor);
  const customers = data?.data.customers ?? [];
  const meta = data?.meta;
  const metrics = useMemo(() => ({
    total: customers.length,
    active: customers.filter((relationship) => relationship.status === "ACTIVE").length,
    blocked: customers.filter((relationship) => relationship.status === "BLOCKED").length,
  }), [customers]);

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setSearchInput(query);
    if (query) setFilters((current) => ({ ...current, q: query }));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = searchInput.trim() || undefined;
      setCursors([]);
      setFilters((current) => current.q === query ? current : { ...current, q: query });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function updateStatus(value: string) {
    setCursors([]);
    setFilters((current) => ({ ...current, status: (value || undefined) as DistributorCustomerStatus | undefined }));
  }

  function clearFilters() {
    setSearchInput("");
    setCursors([]);
    setFilters({});
  }

  return <section className="customers-modern" aria-label="Customers">
    <div className="customers-modern__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Customers</strong></div>
    <Button className="customers-modern__add" onClick={() => setShowForm((shown) => !shown)} aria-label={showForm ? "Close add customer form" : "Add customer"} title={showForm ? "Close form" : "Add customer"}><CustomerIcon name="plus" /></Button>
    {showForm && <div className="customers-modern__form"><CustomerForm onCancel={() => setShowForm(false)} /></div>}
    <div className="customers-modern__metrics" aria-label="Customer summary"><CustomerMetric label="Total customers" value={metrics.total} detail="Your private list" icon="users" tone="brand" /><CustomerMetric label="Active" value={metrics.active} detail="Ready for assisted sales" icon="check" tone="green" /><CustomerMetric label="Blocked" value={metrics.blocked} detail="Needs review" icon="ban" tone="neutral" /></div>
    <div className="customers-modern__toolbar"><label className="customers-modern__search"><CustomerIcon name="search" /><span className="sr-only">Search customers</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search customers by name or phone" /></label><select aria-label="Filter by status" value={filters.status ?? ""} onChange={(event) => updateStatus(event.target.value)}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="BLOCKED">Blocked</option></select><button type="button" className="customers-modern__refresh" aria-label="Refresh customers" onClick={() => refetch()} disabled={isFetching}><CustomerIcon name="refresh" /></button><button type="button" className="customers-modern__clear" onClick={clearFilters}>Clear filters</button></div>
    <div className="customers-modern__table-card">{isLoading ? <div className="customers-modern__loading"><Spinner className="h-5 w-5" />Loading customers…</div> : isError ? <ErrorState message={error instanceof Error ? error.message : "Could not load customers"} onRetry={refetch} /> : customers.length === 0 ? <EmptyState title="No customers found" hint="Add a customer by phone, or change the current filters." /> : <><div className="customers-modern__table-scroll"><table><thead><tr><th>Customer</th><th>Phone</th><th>Status</th><th>Acquisition</th><th>Last activity</th><th className="is-action">Actions</th></tr></thead><tbody>{customers.map((relationship) => { const name = customerDisplayName(relationship); return <tr key={relationship.id}><td><Link href={`/dashboard/customers/${relationship.id}`} className="customers-modern__person"><span>{customerInitials(name)}</span><strong>{name}</strong></Link></td><td>{relationship.customer.phone || "Not provided"}</td><td><CustomerStatusBadge status={relationship.status} /></td><td className="capitalize">{customerSourceLabel(relationship.acquisitionSource)}</td><td>{customerActivityDate(relationship.updatedAt)}</td><td className="is-action"><Link className="customers-modern__view" href={`/dashboard/customers/${relationship.id}`}>View <CustomerIcon name="arrow" /></Link><button className="customers-modern__more" type="button" aria-label={`More actions for ${name}`}><CustomerIcon name="more" /></button></td></tr>; })}</tbody></table></div><div className="customers-modern__mobile-list">{customers.map((relationship) => { const name = customerDisplayName(relationship); return <Link className="customers-modern__mobile-card" key={relationship.id} href={`/dashboard/customers/${relationship.id}`}><span className="customers-modern__avatar">{customerInitials(name)}</span><span className="customers-modern__mobile-copy"><strong>{name}</strong><small>{relationship.customer.phone || "Not provided"}</small><em>{customerSourceLabel(relationship.acquisitionSource)} <i>•</i> {customerActivityDate(relationship.updatedAt)}</em></span><span className="customers-modern__mobile-side"><CustomerStatusBadge status={relationship.status} /><CustomerIcon name="arrow" /></span></Link>; })}</div><div className="customers-modern__footer"><span>Showing {customers.length} customers</span><div><button type="button" disabled={!cursors.length} onClick={() => setCursors((current) => current.slice(0, -1))}>Previous</button><span>{cursors.length + 1}</span><button type="button" disabled={!meta?.hasMore || isFetching} onClick={() => meta?.cursor && setCursors((current) => [...current, meta.cursor!])}>Next</button></div></div></>}</div>
  </section>;
}
