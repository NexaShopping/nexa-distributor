"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useCart } from "@/features/cart/api";
import { Card } from "@/components/ui";

export default function DashboardPage() {
  const { account } = useAuth();
  const admin = usePrimaryAdmin();
  const cart = useCart(admin.data?.account.id ?? "");
  const itemCount = cart.data?.cart.items.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold">
        Welcome back{account?.name ? `, ${account.name.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">Buy stock from NexaShopping and manage your purchases.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
