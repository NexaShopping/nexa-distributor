"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/buy", label: "Products", icon: StoreIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/customers", label: "Customers", icon: CustomersIcon },
  { href: "/dashboard/settlements", label: "Payouts", icon: MoneyIcon },
  { href: "/dashboard/sales", label: "Reports", icon: SalesIcon },
  { href: "/dashboard/credit", label: "Settings", icon: CreditIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, account, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div className="grid flex-1 place-items-center text-ink-soft">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface sm:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
          <Image src="/logo.png" alt="" width={26} height={25} className="h-6.5 w-auto" />
          <span className="font-semibold tracking-tight">
            Nexa<span className="text-brand">Shopping</span>
          </span>
        </div>
        <button type="button" className="mx-4 mt-8 mb-5 rounded-lg bg-brand px-4 py-3 font-semibold text-white shadow-sm hover:bg-brand-strong">
          + <span className="ml-1">New Order</span>
        </button>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-canvas hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-5">
          <div className="flex items-center gap-2.5 sm:hidden">
            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="distributor-mobile-nav" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink transition-colors hover:bg-canvas">
              <span className="sr-only">{mobileMenuOpen ? "Close navigation" : "Open navigation"}</span>
              <span className="text-xl leading-none">{mobileMenuOpen ? "×" : "☰"}</span>
            </button>
            <Image src="/logo.png" alt="" width={24} height={23} className="h-6 w-auto" />
            <span className="font-semibold tracking-tight">
              Nexa<span className="text-brand">Shopping</span>
            </span>
          </div>
          <div className="hidden text-sm text-ink-soft sm:block" />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-soft sm:inline">
              {account?.name ?? account?.phone}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:bg-canvas disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Log out"}
            </button>
          </div>
        </header>
        <>
          <button type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} className={`fixed inset-0 z-40 bg-black/25 transition-opacity sm:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
          <div id="distributor-mobile-nav" className={`fixed inset-y-0 left-0 z-50 w-[min(82vw,320px)] overflow-y-auto border-r border-line bg-surface px-4 py-5 shadow-2xl transition-transform duration-300 ease-out sm:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4"><span className="font-semibold">Navigation</span><button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-2 py-1 text-xl text-ink-soft hover:bg-canvas" aria-label="Close navigation">×</button></div>
            <nav className="grid gap-1">
              {NAV.map((item) => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${active ? "bg-brand/10 text-brand" : "text-ink-soft hover:bg-canvas hover:text-ink"}`}><Icon className="h-5 w-5" />{item.label}</Link>;
              })}
            </nav>
          </div>
        </>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5v9A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-9M4 9.5h16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 15v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17.5" cy="20" r="1.2" />
      <path d="M3 4h2l2.2 11.1a1.5 1.5 0 0 0 1.47 1.2H18a1.5 1.5 0 0 0 1.47-1.19L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path
        d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z M3.5 12 12 16.5 20.5 12 M3.5 16 12 20.5 20.5 16"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path
        d="M6 3.5h9l3.5 3.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z"
        strokeLinejoin="round"
      />
      <path d="M15 3.5V7h3.5M8 11.5h8M8 15h5" strokeLinecap="round" />
    </svg>
  );
}

function CustomersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.4-3.4 2.2-5.2 5.5-5.2s5.1 1.8 5.5 5.2M16 7.5a2.5 2.5 0 0 1 0 5M16.5 14.5c2.4.4 3.7 1.9 4 4.5" strokeLinecap="round" />
    </svg>
  );
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 9h17M8 14h3" strokeLinecap="round" /></svg>;
}

function MoneyIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.5c-.5-.7-1.3-1-2.5-1-1.4 0-2.5.7-2.5 1.8 0 2.7 5.5 1.1 5.5 3.9 0 1.1-1.1 1.9-2.8 1.9-1.2 0-2.2-.4-2.8-1.2M12 7v10" strokeLinecap="round" /></svg>;
}
