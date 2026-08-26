"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useOrders, type OrderFilters } from "@/features/orders/api";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";

type IconName = "search" | "refresh" | "bag" | "list" | "wallet" | "truck" | "check" | "chevron" | "arrow-left" | "arrow-right";
function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></>,
    bag: <><path d="M5 8.5h14l-1 11H6l-1-11Z" /><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5M9 13h6" /></>,
    list: <><path d="M8 5h11M8 12h11M8 19h11" /><path d="M4 5h.01M4 12h.01M4 19h.01" /></>,
    wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="M4 8h16v4h-4a2 2 0 0 0 0 4h4M16 14h.01" /></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></>,
    check: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    "arrow-left": <><path d="m14 5-7 7 7 7M7 12h13" /></>,
    "arrow-right": <><path d="m10 5 7 7-7 7M4 12h13" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const STATUS_TONES: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "orders-status orders-status--warning",
  CONFIRMED: "orders-status orders-status--brand",
  SHIPPED: "orders-status orders-status--brand",
  DELIVERED: "orders-status orders-status--success",
  CANCELLED: "orders-status orders-status--neutral",
};
const STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
function paymentLabel(status: Order["paymentStatus"]) {
  return status === "PAID" ? "Paid" : status === "PENDING" ? "Pending" : "Unpaid";
}

export default function OrdersHistory() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [cursors, setCursors] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("");
  const [dateRange, setDateRange] = useState("90");
  const cursor = cursors.at(-1);
  const { data, isLoading, isError, error, refetch, isFetching } = useOrders(filters, cursor);
  const orders = data?.data.orders ?? [];
  const nextCursor = data?.meta?.cursor;
  const hasMore = data?.meta?.hasMore ?? false;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const visibleOrders = useMemo(() => {
    const now = Date.now();
    const age = dateRange === "all" ? Number.POSITIVE_INFINITY : Number(dateRange) * 24 * 60 * 60 * 1000;
    return orders.filter((order) => {
      const matchesSearch = !search || order.orderNo.toLowerCase().includes(search) || order.items.some((item) => item.productName.toLowerCase().includes(search));
      const matchesPayment = !payment || order.paymentStatus === payment;
      return matchesSearch && matchesPayment && now - new Date(order.placedAt).getTime() <= age;
    });
  }, [dateRange, orders, payment, search]);
  const metrics = useMemo(() => ({
    total: orders.length,
    awaiting: orders.filter((order) => order.status === "AWAITING_PAYMENT").length,
    fulfilment: orders.filter((order) => ["CONFIRMED", "SHIPPED"].includes(order.status)).length,
    completed: orders.filter((order) => order.status === "DELIVERED").length,
  }), [orders]);
  function updateStatus(value: string) {
    setCursors([]);
    setFilters({ status: (value || undefined) as OrderStatus | undefined });
  }
  const metricCards = [
    { label: "Total orders", value: metrics.total, detail: "All purchases", icon: "list" as const, tone: "orange" },
    { label: "Awaiting payment", value: metrics.awaiting, detail: "Needs attention", icon: "wallet" as const, tone: "amber" },
    { label: "In fulfillment", value: metrics.fulfilment, detail: "Moving through Nexa", icon: "truck" as const, tone: "orange" },
    { label: "Completed", value: metrics.completed, detail: "Delivered orders", icon: "check" as const, tone: "green" },
  ];

  return (
    <section className="orders-history" aria-labelledby="orders-title">
      <div className="orders-history__crumb"><Link href="/dashboard">Dashboard</Link><span>›</span><strong>Orders</strong></div>
      <div className="orders-history__metrics">{metricCards.map((card) => <div className="orders-history__metric" key={card.label}><div className={"orders-history__metric-icon orders-history__metric-icon--" + card.tone}><Icon name={card.icon} /></div><div><p>{card.label}</p><strong>{isLoading ? "—" : card.value}</strong><span>{card.detail}</span></div></div>)}</div>
      <div className="orders-history__toolbar">
        <label className="orders-history__search"><Icon name="search" /><span className="sr-only">Search orders</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by order ID or product" /></label>
        <select aria-label="Filter by status" value={filters.status ?? ""} onChange={(event) => updateStatus(event.target.value)}><option value="">All statuses</option><option value="AWAITING_PAYMENT">Awaiting payment</option><option value="CONFIRMED">Confirmed</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select>
        <select aria-label="Filter by payment" value={payment} onChange={(event) => setPayment(event.target.value)}><option value="">All payments</option><option value="PAID">Paid</option><option value="PENDING">Pending</option><option value="UNPAID">Unpaid</option></select>
        <select aria-label="Filter by date" value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option value="90">Last 90 days</option><option value="30">Last 30 days</option><option value="365">Last year</option><option value="all">All time</option></select>
        <button type="button" className="orders-history__clear" onClick={() => { setSearchInput(""); setSearch(""); setPayment(""); setDateRange("90"); updateStatus(""); }}>Clear filters</button>
        <span className="orders-history__sync"><Icon name="refresh" />Updated just now</span>
      </div>
      <div className="orders-history__table-card">
        {isLoading ? <div className="orders-history__loading"><Spinner className="h-5 w-5" />Loading orders…</div> : isError ? <ErrorState message={error instanceof Error ? error.message : "Could not load your orders"} onRetry={refetch} /> : visibleOrders.length === 0 ? <EmptyState title="No orders found" hint={search || payment || filters.status ? "Try clearing a filter or searching for another order." : "Orders you place will show up here."} /> : <>
          <div className="orders-history__table-scroll"><table className="orders-history__table"><thead><tr><th>Order</th><th>Items</th><th>Status</th><th>Payment</th><th className="is-number">Total</th><th>Placed</th><th className="is-action">Action</th></tr></thead><tbody>{visibleOrders.map((order) => <tr key={order.id}><td><Link className="orders-history__order-id" href={"/dashboard/orders/" + order.id}>{order.orderNo}</Link><small>{order.channel === "DISTRIBUTOR_ASSISTED" ? "Assisted order" : "Wholesale purchase"}</small></td><td><div className="orders-history__items"><span className="orders-history__item-stack"><span /><span /><span /></span><span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span></div></td><td><span className={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</span></td><td><span className={"orders-history__payment orders-history__payment--" + order.paymentStatus.toLowerCase()}><i />{paymentLabel(order.paymentStatus)}</span></td><td className="is-number orders-history__total">{formatMoney(order.grandTotal)}</td><td className="orders-history__date">{formatDate(order.placedAt)}</td><td className="is-action"><Link className="orders-history__view" href={"/dashboard/orders/" + order.id}>View<Icon name="chevron" /></Link></td></tr>)}</tbody></table></div>
          <div className="orders-history__mobile-list">{visibleOrders.map((order) => <article className="orders-history__mobile-card" key={order.id}><div className="orders-history__mobile-card-top"><div><Link className="orders-history__order-id" href={"/dashboard/orders/" + order.id}>{order.orderNo}</Link><small>{formatDate(order.placedAt)} · {order.items.length} {order.items.length === 1 ? "item" : "items"}</small></div><span className={STATUS_TONES[order.status]}>{STATUS_LABELS[order.status]}</span></div><div className="orders-history__mobile-card-bottom"><div><span className="orders-history__mobile-label">Payment</span><span className={"orders-history__payment orders-history__payment--" + order.paymentStatus.toLowerCase()}><i />{paymentLabel(order.paymentStatus)}</span></div><div><span className="orders-history__mobile-label">Total</span><strong>{formatMoney(order.grandTotal)}</strong></div><Link className="orders-history__view" href={"/dashboard/orders/" + order.id}>View order<Icon name="chevron" /></Link></div></article>)}</div>
          <div className="orders-history__footer"><span>Showing {visibleOrders.length} of {orders.length} orders</span><label>Rows <select aria-label="Rows per page" defaultValue="10"><option>10</option><option>25</option><option>50</option></select></label><div className="orders-history__pagination"><button type="button" disabled={cursors.length === 0} onClick={() => setCursors((current) => current.slice(0, -1))} aria-label="Previous page"><Icon name="arrow-left" /></button><span>{cursors.length + 1}</span><button type="button" disabled={!hasMore || isFetching} onClick={() => nextCursor && setCursors((current) => [...current, nextCursor])} aria-label="Next page"><Icon name="arrow-right" /></button></div></div>
        </>}
      </div>
    </section>
  );
}
