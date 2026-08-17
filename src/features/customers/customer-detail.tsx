"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpdateCustomer } from "@/features/customers/api";
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
    <div className="space-y-5">
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
