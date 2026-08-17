"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerForm } from "@/features/customers/customer-form";
import { useCustomers, type CustomerFilters } from "@/features/customers/api";
import { Button, EmptyState, ErrorState, Input, Select, Spinner } from "@/components/ui";
import type { DistributorCustomerStatus } from "@/lib/types";

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [cursors, setCursors] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(filters, cursor);
  const customers = data?.data.customers ?? [];
  const meta = data?.meta;

  function updateFilters(next: Partial<CustomerFilters>) {
    setCursors([]);
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="mt-1 text-sm text-ink-soft">Your private customer list and assisted-sale relationships.</p>
        </div>
        <Button onClick={() => setShowForm((shown) => !shown)}>{showForm ? "Close form" : "Add customer"}</Button>
      </div>

      {showForm && <div className="mt-5"><CustomerForm onCancel={() => setShowForm(false)} /></div>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
          <div className="overflow-x-auto rounded-xl border border-line">
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
