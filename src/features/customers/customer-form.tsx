"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/features/customers/api";
import { ApiError } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";

export function CustomerForm({ onCancel }: { onCancel: () => void }) {
  const create = useCreateCustomer();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await create.mutateAsync({
        phone,
        name,
        displayName: displayName || undefined,
        notes: notes || undefined,
      });
      router.push(`/dashboard/customers/${result.customer.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not attach this customer");
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Add or attach customer</h2>
          <p className="mt-1 text-xs text-ink-soft">
            A phone number identifies one customer account globally. Your notes and display name remain private.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Phone in E.164 format</Label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919999999999" required />
          </div>
          <div>
            <Label>Customer name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <Label>Your display name (optional)</Label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <div>
            <Label>Private notes (optional)</Label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={create.isPending || !phone || !name}>
            {create.isPending ? "Saving…" : "Save customer"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={create.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
