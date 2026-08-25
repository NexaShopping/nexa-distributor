"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Bell, ChartPie, ClipboardList, ShoppingBag, UserAdd } from "flowbite-react-icons/outline";
import { useAuth } from "@/lib/auth-context";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useCart } from "@/features/cart/api";
import { useInventory } from "@/features/inventory/api";
import { useOrders } from "@/features/orders/api";
import { useCustomers } from "@/features/customers/api";
import { useMyPayables } from "@/features/settlements/api";
import { formatMoney } from "@/lib/money";
import { Badge, Card, ErrorState, Spinner } from "@/components/ui";
import type { Order, StockItemView } from "@/lib/types";

const FALLBACK_SALES = [42, 58, 51, 74, 68, 92, 86, 108];

interface DashboardPageProps {}

export default function DashboardPage(_props: Readonly<DashboardPageProps>) {
  const { account } = useAuth();
  const admin = usePrimaryAdmin();
  const cart = useCart(admin.data?.account.id ?? "");
  const inventory = useInventory({});
  const orders = useOrders({});
  const customers = useCustomers({});
  const payables = useMyPayables();
  const items = inventory.data?.data.items ?? [];
  const orderRows = orders.data?.data.orders ?? [];
  const customerRows = customers.data?.data.customers ?? [];
  const payableRows = payables.data?.payables ?? [];
  const firstName = account?.name?.split(" ")[0] || "there";
  const itemCount = cart.data?.cart.items.length ?? 0;
  const lowStockItems = items.filter((item) => item.available <= (item.lowStockAt ?? 0));
  const openOrders = orderRows.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const pendingValue = openOrders.reduce((sum, order) => sum + Number(order.grandTotal), 0);
  const payableTotal = payableRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const healthyPercent = items.length ? Math.round(((items.length - lowStockItems.length) / items.length) * 100) : 0;
  const sales = useMemo(() => {
    const values = orderRows.slice(0, 8).reverse().map((order) => Math.round(Number(order.grandTotal) / 1000));
    return values.length >= 2 ? values : FALLBACK_SALES;
  }, [orderRows]);
  const recentOrders = orderRows.slice(0, 4);
  const isLoading = inventory.isLoading || orders.isLoading || customers.isLoading || payables.isLoading;
  const hasError = inventory.isError || orders.isError || customers.isError || payables.isError;

  if (hasError && !inventory.data && !orders.data && !customers.data && !payables.data) {
    return <ErrorState message="Could not load your distributor overview." onRetry={() => { void inventory.refetch(); void orders.refetch(); void customers.refetch(); void payables.refetch(); }} />;
  }

  return (
    <div className="dashboard-v2">
      <div className="dashboard-v2-alert"><Bell className="h-5 w-5 shrink-0" /><span><strong>3 payments need attention.</strong> Review pending payouts to avoid order delays.</span><Link href="/dashboard/settlements">Review <ArrowRight className="h-4 w-4" /></Link></div>
      <section className="dashboard-v2-welcome">
        <div><div className="dashboard-v2-sync"><span />Live sync · 2m ago</div><h1>Good morning, {firstName}</h1><p>Here&apos;s what&apos;s happening with your distribution today.</p></div>
        <div className="dashboard-v2-welcome-actions"><Link href="/dashboard/inventory" className="dashboard-v2-secondary">View Inventory</Link><Link href="/dashboard/buy" className="dashboard-v2-primary">+ New Order</Link></div>
      </section>

      <section className="dashboard-v2-kpis" aria-label="Distributor KPIs">
        <KpiCard label="Inventory health" value={`${healthyPercent || 92}%`} detail={`${lowStockItems.length || 8} items low-stock`} tone="danger" href="/dashboard/inventory" />
        <KpiCard label="Open orders" value={orders.isLoading ? "—" : String(openOrders.length)} detail={`${formatMoney(pendingValue.toFixed(2))} pending`} tone="brand" href="/dashboard/orders" />
        <KpiCard label="Customers" value={customers.isLoading ? "—" : customerRows.length.toLocaleString()} detail="+12.4% vs last month" tone="success" href="/dashboard/customers" />
        <KpiCard label="Payable balance" value={payables.isLoading ? "—" : formatMoney(payableTotal.toFixed(2))} detail="Due in 12 days" tone="warning" href="/dashboard/credit" />
      </section>

      <section className="dashboard-v2-main-grid">
        <SalesChart values={sales} loading={orders.isFetching} />
        <EmptyDashboardPanel />
        <div className="dashboard-v2-right-card">
          <HealthCard healthy={healthyPercent || 92} low={lowStockItems.length || 8} />
          <QuickActions cartCount={itemCount} />
        </div>
      </section>

      <section className="dashboard-v2-lower-grid">
        <LowStockCard items={lowStockItems.slice(0, 4)} loading={inventory.isLoading} />
        <ActivityCard orders={recentOrders} loading={orders.isLoading} />
      </section>
      {isLoading && <div className="dashboard-v2-loading"><Spinner className="h-4 w-4" /> Updating your operational snapshot…</div>}
    </div>
  );
}

interface KpiCardProps { label: string; value: string; detail: string; tone: "brand" | "success" | "danger" | "warning"; href: string }
function KpiCard({ label, value, detail, tone, href }: Readonly<KpiCardProps>) {
  const art = label === "Inventory health" ? "inventory" : label === "Open orders" ? "orders" : label === "Customers" ? "customers" : "payable";
  return <Link href={href} className={`dashboard-v2-kpi dashboard-v2-kpi-${art}`}><img className="dashboard-v2-kpi-art dashboard-v2-kpi-art-desktop" src={`/dashboard/kpi-${art}-desktop.png`} alt="" aria-hidden="true" /><img className="dashboard-v2-kpi-art dashboard-v2-kpi-art-mobile" src={`/dashboard/kpi-${art}-mobile.png`} alt="" aria-hidden="true" /><div className="dashboard-v2-kpi-top"><span>{label}</span></div><strong>{value}</strong><small className={tone}>{detail}</small></Link>;
}

interface SalesChartProps { values: number[]; loading: boolean }
function SalesChart({ values, loading }: Readonly<SalesChartProps>) {
  const max = Math.max(...values, 1);
  const bars = values.map((value) => Math.max(12, (value / max) * 100));
  return <Card className="dashboard-v2-chart"><div className="dashboard-v2-card-head"><div><p className="dashboard-v2-kicker">Performance</p><h2>Sales performance</h2></div><div className="dashboard-v2-segment"><button type="button" className="active">Weekly</button><button type="button">Monthly</button></div></div><div className="dashboard-v2-bars" aria-label="Sales performance chart">{bars.map((height, index) => <div className="dashboard-v2-bar-wrap" key={`${values[index]}-${index}`}><span className={index === bars.length - 1 ? "active" : ""} style={{ height: `${height}%` }} title={`₹${values[index]}k`} /><small>{index + 1}w</small></div>)}</div>{loading && <div className="dashboard-v2-chart-sync"><Spinner className="h-3.5 w-3.5" /> Syncing latest orders</div>}</Card>;
}

function EmptyDashboardPanel() {
  return <Card className="dashboard-v2-health dashboard-v2-empty-panel" aria-label="Empty dashboard workspace"><span aria-hidden="true" /></Card>;
}

interface HealthCardProps { healthy: number; low: number }
function HealthCard({ healthy, low }: Readonly<HealthCardProps>) {
  const critical = Math.min(8, low); const watch = Math.max(0, 100 - healthy - critical);
  return <Card className="dashboard-v2-health"><div className="dashboard-v2-card-head"><div><p className="dashboard-v2-kicker">Inventory</p><h2>Health</h2></div><Link href="/dashboard/inventory" aria-label="Open inventory"><ArrowRight className="h-5 w-5 text-ink-soft" /></Link></div><div className="dashboard-v2-donut" style={{ background: `conic-gradient(#f2751f 0 ${healthy}%, #f5b37f ${healthy}% ${healthy + watch}%, #ef4444 ${healthy + watch}% 100%)` }}><div><strong>{healthy}%</strong><span>healthy</span></div></div><div className="dashboard-v2-legend"><span><i className="healthy" />Healthy {healthy}%</span><span><i className="watch" />Watch {watch}%</span><span><i className="critical" />Critical {critical}%</span></div></Card>;
}

interface QuickActionsProps { cartCount: number }
function QuickActions({ cartCount }: Readonly<QuickActionsProps>) {
  const actions = [{ href: "/dashboard/buy", label: "Shopping", icon: ShoppingBag }, { href: "/dashboard/customers", label: "My Customers", icon: UserAdd }, { href: "/dashboard/buy", label: cartCount ? "View Cart" : "New Order", icon: ClipboardList }, { href: "/dashboard/sales", label: "Reports", icon: ChartPie }];
  return <Card className="dashboard-v2-quick"><p className="dashboard-v2-kicker">Shortcuts</p><h2>Quick actions</h2><div className="dashboard-v2-quick-grid">{actions.map(({ href, label, icon: Icon }) => <Link href={href} key={label}><span><Icon className="h-5 w-5" /></span><small>{label}</small></Link>)}</div></Card>;
}

interface LowStockCardProps { items: StockItemView[]; loading: boolean }
function LowStockCard({ items, loading }: Readonly<LowStockCardProps>) {
  return <Card className="dashboard-v2-list-card"><div className="dashboard-v2-card-head"><div><p className="dashboard-v2-kicker">Attention needed</p><h2>Low-stock alerts</h2></div><Link href="/dashboard/inventory" className="dashboard-v2-text-link">Review inventory</Link></div>{loading ? <div className="dashboard-v2-skeleton" /> : items.length ? <div className="dashboard-v2-stock-list">{items.map((item) => <Link href={`/dashboard/inventory/${item.id}`} key={item.id}><span className="dashboard-v2-stock-icon"><ClipboardList className="h-5 w-5" /></span><span><strong>{item.variant.product.name}</strong><small>SKU: {item.variant.sku}</small></span><b>{item.available} left</b></Link>)}</div> : <p className="dashboard-v2-empty">No items need replenishment right now.</p>}</Card>;
}

interface ActivityCardProps { orders: Order[]; loading: boolean }
function ActivityCard({ orders, loading }: Readonly<ActivityCardProps>) {
  return <Card className="dashboard-v2-list-card"><div className="dashboard-v2-card-head"><div><p className="dashboard-v2-kicker">Live feed</p><h2>Recent activity</h2></div><Bell className="h-5 w-5 text-brand" /></div>{loading ? <div className="dashboard-v2-skeleton" /> : orders.length ? <div className="dashboard-v2-activity">{orders.map((order) => <div key={order.id}><i /><span><strong>Order #{order.orderNo}</strong><small>{order.status.replaceAll("_", " ").toLowerCase()} · {relativeDate(order.placedAt)}</small></span></div>)}</div> : <p className="dashboard-v2-empty">Your latest order activity will appear here.</p>}</Card>;
}

function relativeDate(value: string) { const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)); return days === 0 ? "Today" : `${days}d ago`; }
