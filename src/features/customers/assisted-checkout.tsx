"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlaceAssistedOrder } from "@/features/orders/api";
import { useCart } from "@/features/cart/api";
import { ApiError } from "@/lib/api";
import { Button, Card, Input, Label } from "@/components/ui";
import type { CustomerRelationship, OrderAddress } from "@/lib/types";

export function AssistedCheckout({
  sellerAccountId,
  relationship,
  onCancel,
}: {
  sellerAccountId: string;
  relationship: CustomerRelationship;
  onCancel: () => void;
}) {
  const router = useRouter();
  const place = usePlaceAssistedOrder();
  const cartQuery = useCart(sellerAccountId, relationship.customer.id);
  const [address, setAddress] = useState<OrderAddress>({
    contactName: relationship.displayName || relationship.customer.name || "",
    contactPhone: relationship.customer.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PHONEPE" | "CREDIT">("CREDIT");

  function field<K extends keyof OrderAddress>(key: K) {
    return {
      value: address[key] ?? "",
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setAddress((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await place.mutateAsync({
        sellerAccountId,
        buyerAccountId: relationship.customer.id,
        channel: "DISTRIBUTOR_ASSISTED",
        paymentMethod,
        shippingAddress: address,
      });
      router.push(`/dashboard/sales/${result.order.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not place the assisted order");
    }
  }

  const canSubmit = address.contactName && address.contactPhone && address.line1 && address.city && address.state && address.pincode;

  return (
    <Card className="mt-5 p-5">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-sm font-semibold">Customer delivery address</h2>
          <p className="mt-1 text-xs text-ink-soft">This address is saved only as this order&apos;s delivery snapshot.</p>
        </div>
        <div>
          <Label>Contact name</Label>
          <Input {...field("contactName")} required />
        </div>
        <div>
          <Label>Contact phone</Label>
          <Input {...field("contactPhone")} pattern="\+\d{8,15}" title="Use E.164 format, for example +919999999999" required />
        </div>
        <div className="sm:col-span-2">
          <Label>Address line 1</Label>
          <Input {...field("line1")} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Address line 2 (optional)</Label>
          <Input {...field("line2")} />
        </div>
        <div>
          <Label>City</Label>
          <Input {...field("city")} required />
        </div>
        <div>
          <Label>State</Label>
          <Input {...field("state")} required />
        </div>
        <div>
          <Label>Pincode</Label>
          <Input {...field("pincode")} inputMode="numeric" pattern="\d{6}" title="Enter a six-digit Indian pincode" required />
        </div>
        <div>
          <Label>Country</Label>
          <Input {...field("country")} readOnly />
        </div>
        <div className="assisted-checkout-payment sm:col-span-2"><Label>Payment method</Label><div className="assisted-payment-options"><button type="button" className={paymentMethod === "PHONEPE" ? "is-selected" : ""} onClick={() => setPaymentMethod("PHONEPE")}><strong>PhonePe / UPI</strong><small>Pay securely online</small></button><button type="button" className={paymentMethod === "CREDIT" ? "is-selected" : ""} onClick={() => setPaymentMethod("CREDIT")}><strong>Trade Credit</strong><small>Use available credit balance</small></button></div></div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={!canSubmit || place.isPending}>
            {place.isPending ? "Placing order…" : "Place assisted order"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={place.isPending}>Back to cart</Button>
        </div>
      </form>
    </Card>
  );
}
