"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function toE164(local: string): string {
  return `+91${local.replace(/\D/g, "")}`;
}

function BagMark() {
  return <Image src="/logo.png" alt="" width={48} height={47} className="h-11 w-auto" priority />;
}

function WalletIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7" fill="none"><rect x="4" y="7" width="24" height="19" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M6 11h20M21 17h7v5h-7a2.5 2.5 0 1 1 0-5Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="22" cy="19.5" r=".8" fill="currentColor"/></svg>;
}

function LedgerIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none"><rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M11 10h10M11 15h10M11 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M21 4v24" stroke="currentColor" strokeWidth="1.4"/></svg>;
}

function BoxIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none"><path d="m16 4 11 6v12l-11 6-11-6V10l11-6Z" stroke="currentColor" strokeWidth="1.8"/><path d="m5 10 11 6 11-6M16 16v12M11 7l11 6" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

export default function LoginPage() {
  const { status, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (status === "authed") router.replace("/dashboard"); }, [status, router]);
  useEffect(() => { if (step === "otp") otpInputRef.current?.focus(); }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { await requestOtp(toE164(phone)); setStep("otp"); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not send the code. Try again."); }
    finally { setBusy(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { await verifyOtp(toE164(phone), otp); router.replace("/dashboard"); }
    catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === "NOT_FOUND" ? "No distributor account found for this phone number." : err.code === "FORBIDDEN" ? "This account isn't active yet — contact NexaShopping support." : err.code === "UNAUTHENTICATED" ? "That code is incorrect." : err.message);
      } else setError("Sign-in failed. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-card">
          <div className="brand-lockup"><BagMark /><span>Nexa<span className="brand-orange">Shopping</span></span></div>
          <div className="login-kicker"><span className="store-icon">⌂</span> Distributor Panel</div>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to manage stock, credit, and your ledger.</p>

          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="login-form">
              <label htmlFor="phone">Mobile number</label>
              <div className="phone-field"><span>+91</span><input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" required /></div>
              <div className="remember-row"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> <span>Remember me</span></label><span className="help-link">Use mobile OTP</span></div>
              <button type="submit" disabled={busy || phone.length !== 10}>{busy ? "Sending…" : "Send code"}</button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="login-form">
              <label htmlFor="otp">Verification code</label>
              <p className="otp-hint">Enter the 6-digit code sent to +91 {phone}.</p>
              <input ref={otpInputRef} id="otp" className="otp-field" type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" required />
              <button type="submit" disabled={busy || otp.length !== 6}>{busy ? "Verifying…" : "Verify & sign in"}</button>
              <button type="button" className="link-button" onClick={() => { setStep("phone"); setOtp(""); setError(null); }}>Use a different number</button>
            </form>
          )}
          {error && <p className="login-error">{error}</p>}
          <div className="secure-note"><span>♢</span> Secure access for approved distributors</div>
        </div>
      </section>

      <section className="login-hero" aria-label="Distributor credit overview">
        <div className="hero-dots" />
        <div className="hero-copy"><p>Stock now.<br />Settle later<span className="brand-orange">.</span></p><span className="hero-rule" /><small>Every rupee on the ledger.</small></div>
        <div className="credit-card"><div className="credit-icon"><WalletIcon /></div><div><small>CREDIT AVAILABLE</small><strong>₹2,57,650</strong><span><i /> Within credit limit</span></div></div>
        <Image src="/warehouse-hero.png" alt="Illustration of a distributor warehouse and stock" fill priority className="warehouse-art" sizes="(min-width: 1024px) 58vw, 0px" />
        <div className="ledger-card"><h2>Ledger overview</h2><div className="ledger-head"><span>PARTICULARS</span><span>DATE</span><span>AMOUNT (₹)</span></div><div className="ledger-row"><b><BoxIcon /> Stock Transfer</b><span>08 May 2025</span><em>+1,24,500</em></div><div className="ledger-row"><b><LedgerIcon /> Customer Order Billed</b><span>09 May 2025</span><em>+86,750</em></div><div className="ledger-row"><b className="green"><span>₹</span> Repayment Received</b><span>12 May 2025</span><em className="red">-53,600</em></div><div className="ledger-total"><span>Current Balance</span><strong>₹2,57,650</strong></div></div>
        <div className="flow-badge truck-badge"><span>♧</span><b>GOODS<br />FLOW</b></div><div className="flow-badge money-badge"><span>₹</span><b>MONEY<br />FLOW</b></div>
        <div className="stock-card"><span>STOCK VALUE</span><strong>₹18,74,920</strong><div className="sparkline" /></div>
        <div className="hero-footer"><div><BoxIcon /><span><b>Live stock insights</b><small>Track inventory in real time</small></span></div><div><LedgerIcon /><span><b>Transparent ledger</b><small>Every transaction, in one place</small></span></div><div><span className="shield">✓</span><span><b>Secure & trusted</b><small>Bank-grade security</small></span></div></div>
      </section>
    </main>
  );
}
