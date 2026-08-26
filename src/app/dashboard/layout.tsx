"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";
import { usePrimaryAdmin } from "@/features/admin/api";
import { useCart, useUpdateCartItem } from "@/features/cart/api";
import { formatMoney } from "@/lib/money";
import { ToastProvider } from "@/components/feedback";
import { Bars, CartPlus, ChartPie, Close, Cog, Home, Store, User, Users, Wallet } from "flowbite-react-icons/outline";
import { Drawer } from "vaul";
import "./sidebar.css";
import "./cart-header.css";
import "./cart-header-overrides.css";
import "./dashboard-header-overrides.css";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/buy", label: "Shopping", icon: Store },
  { href: "/dashboard/inventory", label: "Inventory", icon: StackIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/settlements", label: "Payouts", icon: Wallet },
  { href: "/dashboard/sales", label: "Sales", icon: ChartPie },
  { href: "/dashboard/credit", label: "Credits", icon: Cog },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

function getPageHeader(pathname: string) {
  if (pathname === "/dashboard") return { title: "Distributor overview", description: "Your inventory, customer sales, and settlement pulse at a glance." };
  if (pathname.startsWith("/dashboard/buy")) return { title: "Wholesale Catalog", description: "Browse and purchase inventory directly from Nexa central supply." };
  if (pathname.startsWith("/dashboard/cart")) return { title: "Your cart", description: "Review stock selections before placing your order." };
  if (pathname.startsWith("/dashboard/inventory/")) return { title: "Inventory details", description: "Review stock, pricing, and availability for this item." };
  if (pathname.startsWith("/dashboard/inventory")) return { title: "Inventory", description: "Manage your available products and stock." };
  if (pathname.startsWith("/dashboard/orders/")) return { title: "Purchase details", description: "Review payment, delivery, and order items." };
  if (pathname.startsWith("/dashboard/orders")) return { title: "Orders", description: "Track purchases, payments, and fulfillment in one place." };
  if (pathname.startsWith("/dashboard/customers/") && pathname.endsWith("/sale")) return { title: "Assisted sale", description: "Create a sale for one of your customers." };
  if (pathname.startsWith("/dashboard/customers/")) return { title: "Customer details", description: "Review customer information and sale history." };
  if (pathname.startsWith("/dashboard/customers")) return { title: "Customers", description: "Your private customer list and assisted-sale relationships." };
  if (pathname.startsWith("/dashboard/sales/")) return { title: "Sale details", description: "Review the customer sale and settlement status." };
  if (pathname.startsWith("/dashboard/sales")) return { title: "Sales", description: "Track customer sales fulfilled from your inventory." };
  if (pathname.startsWith("/dashboard/settlements")) return { title: "Settlements", description: "Track customer-sale proceeds released by NexaShopping." };
  if (pathname.startsWith("/dashboard/credit")) return { title: "Trade credit", description: "Track your balance, due charges, and repayments." };
  if (pathname.startsWith("/dashboard/profile")) return { title: "Profile", description: "Manage your distributor account details." };
  return { title: "Distributor workspace", description: "Manage your NexaShopping account." };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status, account, logout } = useAuth();
  const admin = usePrimaryAdmin();
  const cart = useCart(admin.data?.account.id ?? "");
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pageHeader = getPageHeader(pathname);
  const displayName = account?.name?.trim() || account?.phone || "Distributor";
  const profileInitial = displayName.charAt(0).toUpperCase();

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
    setLogoutConfirmOpen(false);
    setSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <ToastProvider><div className="flex h-screen w-full min-w-0 flex-1 overflow-hidden">
      <aside className="distributor-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-hidden sm:flex">
        <div className="distributor-sidebar__brand"><div className="distributor-sidebar__logo"><Image src="/logo.png" alt="" width={26} height={25} /></div><div><span>Nexa<span>Shopping</span></span><small>Distributor workspace</small></div>
        </div>
        <nav className="distributor-sidebar__nav">
          <p className="distributor-sidebar__label">Workspace</p>
          {NAV.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`distributor-sidebar__link ${active ? "is-active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="distributor-sidebar__footer">
          <div className="distributor-sidebar__account"><Link href="/dashboard/profile" className="distributor-sidebar__account-avatar">{profileInitial}</Link><Link href="/dashboard/profile" className="distributor-sidebar__account-copy"><strong>{displayName}</strong><small>View profile</small></Link><button type="button" onClick={() => setLogoutConfirmOpen(true)} aria-label="Log out"><Close className="h-4 w-4" /></button></div>
        </div>
      </aside>

      <div className="flex h-screen min-h-0 w-full min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Drawer.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
              <div className="flex shrink-0 items-center gap-2.5 sm:hidden">
                <Drawer.Trigger asChild>
                  <button type="button" aria-expanded={mobileMenuOpen} aria-controls="distributor-mobile-nav" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink transition-colors hover:bg-canvas">
                    <span className="sr-only">{mobileMenuOpen ? "Close navigation" : "Open navigation"}</span>
                    {mobileMenuOpen ? <Close className="h-5 w-5" /> : <Bars className="h-5 w-5" />}
                  </button>
                </Drawer.Trigger>
                <Image src="/logo.png" alt="" width={24} height={23} className="h-6 w-auto" />
              </div>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
                <Drawer.Content id="distributor-mobile-nav" className="distributor-mobile-drawer fixed inset-y-0 left-0 z-50 flex h-screen w-[min(82vw,320px)] flex-col overflow-hidden px-4 py-5 shadow-2xl outline-none">
                  <Drawer.Title className="sr-only">Distributor navigation</Drawer.Title>
                  <div className="distributor-mobile-drawer__head"><div><strong>Nexa<span>Shopping</span></strong><small>Distributor workspace</small></div><Drawer.Close asChild><button type="button" aria-label="Close navigation"><Close className="h-5 w-5" /></button></Drawer.Close></div>
                  <nav className="distributor-sidebar__nav distributor-sidebar__nav--mobile"><p className="distributor-sidebar__label">Workspace</p>
                    {NAV.map((item) => {
                      const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return <Drawer.Close key={item.href} asChild><Link href={item.href} className={`distributor-sidebar__link ${active ? "is-active" : ""}`}><Icon className="h-5 w-5" />{item.label}</Link></Drawer.Close>;
                    })}
                  </nav>
                  <div className="distributor-sidebar__footer distributor-sidebar__footer--mobile">
                    <button type="button" onClick={() => { setMobileMenuOpen(false); setLogoutConfirmOpen(true); }} className="distributor-sidebar__logout"><Close className="h-4 w-4" />Log out</button>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
            <div className={`min-w-0 ${pathname.includes("/customers/") && pathname.endsWith("/sale") ? "dashboard-page-title--hidden" : ""}`}>
              <p className="truncate text-sm font-semibold tracking-tight text-ink sm:text-base">{pageHeader.title}</p>
              <p className="hidden max-w-2xl truncate text-xs text-ink-soft sm:block">{pageHeader.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <CartHeader cart={cart.data?.cart} sellerAccountId={admin.data?.account.id ?? ""} open={cartOpen} onToggle={() => setCartOpen((open) => !open)} onClose={() => setCartOpen(false)} />
            <Link href="/dashboard/profile" aria-label={`Open profile for ${displayName}`} title={displayName} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-brand/10 text-sm font-semibold text-brand transition hover:ring-2 hover:ring-brand/20">
              {account?.avatarUrl ? <img src={account.avatarUrl} alt="" className="h-full w-full object-cover" /> : profileInitial}
            </Link>
          </div>
        </header>
        <main className="w-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6">{children}</main>
      </div>
      {logoutConfirmOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/35 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl"><h2 id="logout-title" className="text-base font-semibold">Log out of NexaShopping?</h2><p className="mt-2 text-sm text-ink-soft">You’ll need to sign in again to manage your distributor account.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setLogoutConfirmOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">Cancel</button><button type="button" onClick={handleLogout} disabled={signingOut} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">{signingOut ? "Signing out…" : "Log out"}</button></div></div></div>}
    </div></ToastProvider>
  );
}

function CartHeader({ cart, sellerAccountId, open, onToggle, onClose }: { cart?: import("@/lib/types").CartView; sellerAccountId: string; open: boolean; onToggle: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const updateCart = useUpdateCartItem(sellerAccountId);
  useEffect(() => { if (!open) return; const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) onClose(); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, [open, onClose]);
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return <div className="header-cart" ref={ref}><button type="button" className="header-cart__button" aria-label={`Cart, ${count} items`} aria-expanded={open} onClick={onToggle}><CartPlus className="h-4 w-4" />{count > 0 && <span>{count > 99 ? "99+" : count}</span>}</button>{open && <div className="header-cart__popover"><div className="header-cart__head"><div><strong>Your cart</strong><small>{count} {count === 1 ? "item" : "items"}</small></div><Link href="/dashboard/cart" onClick={onClose}>View cart</Link></div>{cart?.items.length ? <div className="header-cart__items">{cart.items.map((item) => <div className="header-cart__item" key={item.id}><div className="header-cart__item-copy"><strong>{item.name}</strong><small>{item.sku}</small><div className="header-cart__quantity"><button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={updateCart.isPending || item.quantity <= 1} onClick={() => void updateCart.mutateAsync({ id: item.id, quantity: item.quantity - 1 })}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} disabled={updateCart.isPending || item.quantity >= item.available} onClick={() => void updateCart.mutateAsync({ id: item.id, quantity: item.quantity + 1 })}>+</button></div></div><b>{formatMoney(item.lineTotal)}</b></div>)}</div> : <div className="header-cart__empty">Your cart is empty.<Link href="/dashboard/buy" onClick={onClose}>Browse shopping</Link></div>}{cart?.items.length ? <div className="header-cart__total"><span>Subtotal</span><strong>{formatMoney(cart.subtotal)}</strong></div> : null}</div>}</div>;
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
