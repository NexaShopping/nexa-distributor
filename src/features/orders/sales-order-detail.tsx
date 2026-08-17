"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { useCancelOrder, useConfirmOrder, useDeliverOrder, useShipOrder } from "@/features/orders/api";
import { Button, Card } from "@/components/ui";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_TONES: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-neutral-100 text-neutral-600",
};

export function SalesOrderDetail({ order }: { order: Order }) {
  const confirm = useConfirmOrder(order.id);
  const ship = useShipOrder(order.id);
  const deliver = useDeliverOrder(order.id);
  const cancel = useCancelOrder(order.id);
  const [error, setError] = useState<string | null>(null);
  const pending = confirm.isPending || ship.isPending || deliver.isPending || cancel.isPending;

  async function run(label: string, operation: () => Promise<unknown>) {
    if (!window.confirm(`${label} order ${order.orderNo}?`)) return;
    setError(null);
    try {
      await operation();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : `Could not ${label.toLowerCase()} this order`);
    }
  }

  async function cancelOrder() {
    const reason = window.prompt("Cancellation reason (optional)");
    if (reason === null) return;
    await run("Cancel", () => cancel.mutateAsync(reason || undefined));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{order.orderNo}</h1>
          <p className="mt-1 text-sm text-ink-soft">Customer sale placed {new Date(order.placedAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONES[order.status]}`}>
          {order.status.toLowerCase().replaceAll("_", " ")}
        </span>
      </div>

      {(order.status === "AWAITING_PAYMENT" || order.status === "CONFIRMED" || order.status === "SHIPPED") && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {order.status === "AWAITING_PAYMENT" && <Button disabled={pending} onClick={() => run("Confirm", () => confirm.mutateAsync())}>Confirm order</Button>}
            {order.status === "CONFIRMED" && <Button disabled={pending} onClick={() => run("Ship", () => ship.mutateAsync())}>Mark shipped</Button>}
            {order.status === "SHIPPED" && <Button disabled={pending} onClick={() => run("Deliver", () => deliver.mutateAsync())}>Mark delivered</Button>}
            {(order.status === "AWAITING_PAYMENT" || order.status === "CONFIRMED") && <Button variant="danger" disabled={pending} onClick={cancelOrder}>Cancel order</Button>}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Delivery snapshot</h2>
          <address className="mt-3 not-italic text-sm leading-6 text-ink-soft">
            <p className="font-medium text-ink">{order.shippingAddress.contactName}</p>
            <p>{order.shippingAddress.contactPhone}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p>{order.shippingAddress.country ?? "IN"}</p>
          </address>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Order status</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Meta label="Payment" value={order.paymentStatus.toLowerCase()} />
            <Meta label="Fulfilment" value={order.fulfilmentStatus.toLowerCase()} />
            <Meta label="Confirmed" value={order.confirmedAt ? new Date(order.confirmedAt).toLocaleString() : "—"} />
            <Meta label="Shipped" value={order.shippedAt ? new Date(order.shippedAt).toLocaleString() : "—"} />
            <Meta label="Delivered" value={order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "—"} />
            {order.cancelledAt && <Meta label="Cancelled" value={new Date(order.cancelledAt).toLocaleString()} />}
            {order.cancelReason && <Meta label="Cancellation reason" value={order.cancelReason} />}
          </dl>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="text-sm font-semibold">Items</h2></div>
        <div className="divide-y divide-line">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
              <div><p className="font-medium">{item.productName} · {item.variantLabel}</p><p className="font-mono text-xs text-ink-soft">{item.sku}</p></div>
              <p className="text-ink-soft">{item.quantity} × {formatMoney(item.unitPrice)}</p>
              <p className="font-medium">{formatMoney(item.lineTotal)}</p>
            </div>
          ))}
        </div>
        <dl className="space-y-2 border-t border-line bg-canvas px-5 py-4 text-sm">
          <Total label="Subtotal" value={order.subtotal} />
          <Total label="Discount" value={order.discountTotal} />
          <Total label="Tax" value={order.taxTotal} />
          <Total label="Shipping" value={order.shippingTotal} />
          <Total label="Grand total" value={order.grandTotal} bold />
        </dl>
      </Card>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink-soft">{label}</dt><dd className="text-right capitalize">{value}</dd></div>;
}

function Total({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "border-t border-line pt-2 font-semibold" : ""}`}><dt className="text-ink-soft">{label}</dt><dd>{formatMoney(value)}</dd></div>;
}
