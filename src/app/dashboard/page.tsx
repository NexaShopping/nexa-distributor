"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useCart } from "@/features/cart/api";
import { useInventory } from "@/features/inventory/api";
import { useOrders } from "@/features/orders/api";
import { useCustomers } from "@/features/customers/api";
import { useMyPayables } from "@/features/settlements/api";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui";

export default function DashboardPage() {
  const { account } = useAuth();
  const admin = usePrimaryAdmin();
  const cart = useCart(admin.data?.account.id ?? "");
  const itemCount = cart.data?.cart.items.length ?? 0;
  const inventory = useInventory({});
  const orders = useOrders({});
  const customers = useCustomers({});
  const payables = useMyPayables();
  const lowStock = (inventory.data?.data.items ?? []).filter((item) => item.available <= (item.lowStockAt ?? 0)).length;
  const payableTotal = (payables.data?.payables ?? []).reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div className="dashboard-overview mx-auto max-w-5xl">
      <div className="dashboard-hero"><div><p className="dashboard-eyebrow">Distributor workspace</p><h1 className="text-xl font-semibold">
        Welcome back{account?.name ? `, ${account.name.split(" ")[0]}` : ""}
      </h1><p className="mt-1 text-sm text-ink-soft">Your inventory, customer sales, and settlement pulse at a glance.</p></div><Link href="/dashboard/buy" className="dashboard-hero-action">Buy stock</Link></div>

      <div className="dashboard-metrics"><Metric label="Inventory items" value={inventory.data?.data.items.length ?? "—"} href="/dashboard/inventory" /><Metric label="Open orders" value={orders.data?.data.orders.length ?? "—"} href="/dashboard/orders" /><Metric label="Customers" value={customers.data?.data.customers.length ?? "—"} href="/dashboard/customers" /><Metric label="Payable balance" value={payables.data ? formatMoney(payableTotal.toFixed(2)) : "—"} href="/dashboard/settlements" /></div>

      <div className="dashboard-alerts"><Card className={lowStock > 0 ? "dashboard-alert dashboard-alert-warn" : "dashboard-alert"}><div><p className="dashboard-card-label">Inventory health</p><h2>{lowStock > 0 ? `${lowStock} low-stock item${lowStock === 1 ? "" : "s"}` : "Inventory is healthy"}</h2><p>{lowStock > 0 ? "Review replenishment before your next customer sale." : "No immediate replenishment actions needed."}</p></div><Link href="/dashboard/inventory">Review</Link></Card><Card className="dashboard-alert"><div><p className="dashboard-card-label">Your cart</p><h2>{itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"} waiting` : "Cart is ready"}</h2><p>{itemCount > 0 ? "Finish your stock purchase when you’re ready." : "Browse admin stock to build your inventory."}</p></div><Link href={itemCount > 0 ? "/dashboard/cart" : "/dashboard/buy"}>{itemCount > 0 ? "View cart" : "Browse"}</Link></Card></div>

      <div className="dashboard-actions mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium">Browse the catalog</p>
            <p className="text-sm text-ink-soft">See what&apos;s available to buy right now.</p>
          </div>
          <Link
            href="/dashboard/buy"
            className="inline-flex h-9 shrink-0 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong"
          >
            Shop
          </Link>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium">Your cart</p>
            <p className="text-sm text-ink-soft">
              {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"} waiting` : "Nothing added yet"}
            </p>
          </div>
          <Link
            href="/dashboard/cart"
            className="inline-flex h-9 shrink-0 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-canvas"
          >
            View cart
          </Link>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div><p className="text-sm font-medium">Customers</p><p className="text-sm text-ink-soft">Manage relationships and start assisted sales.</p></div>
          <Link href="/dashboard/customers" className="inline-flex h-9 shrink-0 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-canvas">Open</Link>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div><p className="text-sm font-medium">Customer sales</p><p className="text-sm text-ink-soft">Confirm, ship, and deliver customer orders.</p></div>
          <Link href="/dashboard/sales" className="inline-flex h-9 shrink-0 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-canvas">View sales</Link>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div><p className="text-sm font-medium">Trade credit</p><p className="text-sm text-ink-soft">Review balance and repay outstanding credit.</p></div>
          <Link href="/dashboard/credit" className="inline-flex h-9 shrink-0 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-canvas">Open</Link>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div><p className="text-sm font-medium">Settlements</p><p className="text-sm text-ink-soft">Track proceeds from customer sales.</p></div>
          <Link href="/dashboard/settlements" className="inline-flex h-9 shrink-0 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-canvas">View</Link>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: number | string; href: string }) {
  return <Link href={href} className="dashboard-metric"><span>{label}</span><strong>{value}</strong><small>View details →</small></Link>;
}
