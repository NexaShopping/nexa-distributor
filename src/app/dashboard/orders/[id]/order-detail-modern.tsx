"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCancelOrder, useOrder } from "@/features/orders/api";
import { ContinuePhonePePayment } from "@/features/orders/payment-actions";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { Button, Card, ErrorState, Input, Spinner } from "@/components/ui";
import type { Order, OrderAddress, OrderStatus } from "@/lib/types";

type DetailIcon = "check" | "clock" | "truck" | "package" | "card" | "location";
function Icon({ name, className = "h-4 w-4" }: { name: DetailIcon; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<DetailIcon, React.ReactNode> = {
    check: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></>,
    package: <><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 14h3" /></>,
    location: <><path d="M19 10c0 4.5-7 10-7 10S5 14.5 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const STEPS: Array<{ status: OrderStatus; label: string; icon: DetailIcon }> = [
  { status: "AWAITING_PAYMENT", label: "Order placed", icon: "package" },
  { status: "CONFIRMED", label: "Confirmed", icon: "check" },
  { status: "SHIPPED", label: "Shipped", icon: "truck" },
  { status: "DELIVERED", label: "Delivered", icon: "check" },
];
const CANCELLABLE: OrderStatus[] = ["AWAITING_PAYMENT", "CONFIRMED"];
function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Pending";
}
function statusIndex(status: OrderStatus) {
  if (status === "DELIVERED") return 3;
  if (status === "SHIPPED") return 2;
  if (status === "CONFIRMED") return 1;
  return 0;
}

export default function OrderDetailModern() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useOrder(id);
  if (isLoading) return <div className="order-detail-modern__loading"><Spinner className="h-5 w-5" />Loading order…</div>;
  if (isError || !data) return <ErrorState message="Could not load this order" onRetry={refetch} />;
  return <OrderDetailContent order={data.order} />;
}

function OrderDetailContent({ order }: { order: Order }) {
  const cancel = useCancelOrder(order.id);
  const [reason, setReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function doCancel(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    try { await cancel.mutateAsync(reason || undefined); setShowCancel(false); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not cancel this order"); }
  }
  const activeStep = statusIndex(order.status);
  const stepDates = [order.placedAt, order.confirmedAt, order.shippedAt, order.deliveredAt];
  const statusLabel = order.status === "AWAITING_PAYMENT" ? "Awaiting payment" : order.status.charAt(0) + order.status.slice(1).toLowerCase();
  return (
    <section className="order-detail-modern" aria-labelledby="order-detail-title">
      <Link href="/dashboard/orders" className="order-detail-modern__back">← Orders</Link>
      <div className="order-detail-modern__heading"><div><p className="order-detail-modern__eyebrow">Order details</p><h1 id="order-detail-title">{order.orderNo}</h1><p className="order-detail-modern__placed">Placed {formatDate(order.placedAt)}</p></div><div className="order-detail-modern__heading-actions"><span className={"order-detail-modern__status order-detail-modern__status--" + order.status.toLowerCase()}>{statusLabel}</span>{CANCELLABLE.includes(order.status) && order.paymentMethod !== "PHONEPE" && !showCancel && <Button size="sm" variant="danger" onClick={() => setShowCancel(true)}>Cancel order</Button>}</div></div>
      {order.status === "CANCELLED" ? <div className="order-detail-modern__cancelled"><Icon name="clock" /><div><strong>Order cancelled</strong><p>{order.cancelReason || "This order is no longer active."}</p></div></div> : <div className="order-detail-modern__stepper" aria-label="Order progress">{STEPS.map((step, index) => <div className={"order-step " + (index <= activeStep ? "order-step--complete " : "") + (index === activeStep ? "order-step--active" : "")} key={step.label}><div className="order-step__marker"><Icon name={step.icon} /></div><div className="order-step__copy"><strong>{step.label}</strong><span>{formatDate(stepDates[index])}</span></div>{index < STEPS.length - 1 && <div className={"order-step__line " + (index < activeStep ? "order-step__line--complete" : "")} />}</div>)}</div>}
      {showCancel && <Card className="order-detail-modern__cancel-card"><form onSubmit={doCancel}><label>Reason (optional)<Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us why you are cancelling" /></label>{error && <p className="order-detail-modern__form-error">{error}</p>}<div><Button type="submit" size="sm" variant="danger" disabled={cancel.isPending}>{cancel.isPending ? "Cancelling…" : "Confirm cancellation"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setShowCancel(false)}>Never mind</Button></div></form></Card>}
      {order.paymentMethod === "PHONEPE" && order.status === "AWAITING_PAYMENT" && <div className="order-detail-modern__payment-action"><ContinuePhonePePayment orderId={order.id} /></div>}
      <div className="order-detail-modern__grid"><div className="order-detail-modern__main">
        <Card className="order-detail-modern__card order-detail-modern__items-card"><div className="order-detail-modern__card-heading"><div><p className="order-detail-modern__kicker">Purchase summary</p><h2>Order items</h2></div><span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span></div><div className="order-detail-modern__items">{order.items.map((item) => <div className="order-detail-modern__item" key={item.id}><div className="order-detail-modern__item-art"><Icon name="package" /></div><div className="order-detail-modern__item-copy"><strong>{item.productName}</strong><span>{item.variantLabel} · {item.sku}</span><small>{item.quantity} × {formatMoney(item.unitPrice)}</small></div><b>{formatMoney(item.lineTotal)}</b></div>)}</div></Card>
        <Card className="order-detail-modern__card"><div className="order-detail-modern__card-heading"><div><p className="order-detail-modern__kicker">Payment</p><h2>Payment details</h2></div><Icon name="card" /></div>{order.payment ? <div className="order-detail-modern__payment-grid"><Info label="Method" value={order.paymentMethod === "PHONEPE" ? "PhonePe" : order.paymentMethod || "—"} /><Info label="Status" value={order.payment.status.toLowerCase()} /><Info label="Amount" value={formatMoney(order.payment.amount)} /><Info label="Reference" value={order.payment.providerReference || "Pending"} /></div> : <p className="order-detail-modern__muted">No payment attempt was recorded for this order.</p>}</Card>
      </div><aside className="order-detail-modern__aside">
        <Card className="order-detail-modern__card"><div className="order-detail-modern__card-heading"><div><p className="order-detail-modern__kicker">Order total</p><h2>Payment summary</h2></div><Icon name="card" /></div><div className="order-detail-modern__totals"><Info label="Subtotal" value={formatMoney(order.subtotal)} /><Info label="Discount" value={formatMoney(order.discountTotal)} /><Info label="Tax" value={formatMoney(order.taxTotal)} /><Info label="Shipping" value={formatMoney(order.shippingTotal)} /><div className="order-detail-modern__grand"><span>Total</span><strong>{formatMoney(order.grandTotal)}</strong></div></div></Card>
        <Card className="order-detail-modern__card"><div className="order-detail-modern__card-heading"><div><p className="order-detail-modern__kicker">Delivery</p><h2>Shipping address</h2></div><Icon name="location" /></div><AddressBlock address={order.shippingAddress} /></Card>
      </aside></div>
    </section>
  );
}
function Info({ label, value }: { label: string; value: string }) { return <div className="order-detail-modern__info"><span>{label}</span><strong>{value}</strong></div>; }
function AddressBlock({ address }: { address: OrderAddress }) { return <address className="order-detail-modern__address"><strong>{address.contactName}</strong><span>{address.contactPhone}</span><span>{address.line1}{address.line2 ? ", " + address.line2 : ""}</span><span>{address.city}, {address.state} {address.pincode}</span></address>; }
