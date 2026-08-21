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

function StoreIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="store-icon-svg" fill="none"><path d="M4 10h16M5 10v9h14v-9M8 19v-5h8v5M4 10l1.5-5h13L20 10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M4 10c.4 1.1 1.2 1.7 2.4 1.7S8.5 11.1 9 10c.5 1.1 1.3 1.7 2.5 1.7S13.7 11.1 14 10c.5 1.1 1.3 1.7 2.5 1.7S18.8 11.1 20 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="google-icon"><path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.7 2.92-4.2 2.92-7.19Z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.34l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.5A9.75 9.75 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.53 13.87A5.86 5.86 0 0 1 6.22 12c0-.65.11-1.28.31-1.87v-2.5H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.37l3.24-2.5Z" /><path fill="#EA4335" d="M12 6.1c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.24 2.5C7.3 7.82 9.46 6.1 12 6.1Z" /></svg>;
}

function WalletIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7" fill="none"><rect x="4" y="7" width="24" height="19" rx="4" stroke="currentColor" strokeWidth="1.8" /><path d="M6 11h20M21 17h7v5h-7a2.5 2.5 0 1 1 0-5Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="22" cy="19.5" r=".8" fill="currentColor" /></svg>;
}

function LedgerIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none"><rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M11 10h10M11 15h10M11 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M21 4v24" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

function BoxIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="h-5 w-5" fill="none"><path d="m16 4 11 6v12l-11 6-11-6V10l11-6Z" stroke="currentColor" strokeWidth="1.8" /><path d="m5 10 11 6 11-6M16 16v12M11 7l11 6" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export default function LoginPage() {
  const { status, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [remember, setRemember] = useState(true);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (status === "authed") router.replace("/dashboard"); }, [status, router]);
  useEffect(() => { if (step === "otp") otpInputRef.current?.focus(); }, [step]);
  useEffect(() => { if (error) setToast({ type: "error", message: error }); }, [error]);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const sent = await requestOtp(toE164(phone));
      if (!sent) {
        const message = "No active distributor account was found for this mobile number.";
        setError(message); setToast({ type: "error", message }); return;
      }
      setStep("otp");
      setResendSeconds(60);
      setToast({ type: "success", message: "OTP sent successfully. Check your mobile." });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not send the code. Try again.";
      setError(message); setToast({ type: "error", message });
    }
    finally { setBusy(false); }
  }

  async function handleResendCode() {
    if (busy || resendSeconds > 0) return;
    setBusy(true); setError(null);
    try {
      const sent = await requestOtp(toE164(phone));
      if (!sent) { setError("No active distributor account was found for this mobile number."); return; }
      setResendSeconds(60);
      setToast({ type: "success", message: "A new OTP was sent successfully." });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not resend the code. Try again.";
      setError(message); setToast({ type: "error", message });
    } finally { setBusy(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { await verifyOtp(toE164(phone), otp); setToast({ type: "success", message: "Signed in successfully." }); setTimeout(() => router.replace("/dashboard"), 350); }
    catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === "NOT_FOUND" ? "No distributor account found for this phone number." : err.code === "FORBIDDEN" ? "This account isn't active yet — contact NexaShopping support." : err.code === "UNAUTHENTICATED" ? "That code is incorrect." : err.message);
      } else setError("Sign-in failed. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="mobile-login-art" aria-hidden="true" />
        <div className="login-card">
          <div className="brand-lockup"><BagMark /><span>Nexa<span className="brand-orange">Shopping</span></span></div>
          <div className="login-kicker"><span className="store-icon"><StoreIcon /></span> Distributor Panel</div>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to manage stock, credit, and your ledger.</p>

          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="login-form">
              <div className="phone-field floating-field"><span>+91</span><input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder=" " required /><label htmlFor="phone">Mobile number</label></div>
              <div className="remember-row"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> <span>Remember me</span></label></div>
              <button type="button" className="google-button" onClick={() => setToast({ type: "info", message: "Google sign-in is coming soon. Please continue with mobile OTP." })}><GoogleIcon /> Continue with Google</button>
              <div className="button-divider" aria-hidden="true"><span>or</span></div>
              <button type="submit" disabled={busy || phone.length !== 10}>{busy ? "Sending…" : "Send code"}</button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="login-form">
              <p className="otp-hint">Enter the 6-digit code sent to +91 {phone}.</p>
              <div className="otp-field floating-field"><input ref={otpInputRef} id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder=" " required /><label htmlFor="otp">Verification code</label></div>
              <button type="submit" disabled={busy || otp.length !== 6}>{busy ? "Verifying…" : "Verify & sign in"}</button>
              <div className="resend-row"><span>{resendSeconds > 0 ? `Resend code in 0:${String(resendSeconds).padStart(2, "0")}` : "Didn't receive the code?"}</span><button type="button" className="resend-button" disabled={busy || resendSeconds > 0} onClick={handleResendCode}>Resend OTP</button></div>
              <button type="button" className="link-button" onClick={() => { setStep("phone"); setOtp(""); setError(null); setResendSeconds(0); }}>Use a different number</button>
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
        <Image src="/hero-bg.png" alt="Illustration of NexaShopping goods flow" fill priority className="warehouse-art" sizes="(min-width: 1024px) 58vw, 0px" />
        <div className="ledger-card"><h2>Ledger overview</h2><div className="ledger-head"><span>PARTICULARS</span><span>DATE</span><span>AMOUNT (₹)</span></div><div className="ledger-row"><b><BoxIcon /> Stock Transfer</b><span>08 May 2025</span><em>+1,24,500</em></div><div className="ledger-row"><b><LedgerIcon /> Customer Order Billed</b><span>09 May 2025</span><em>+86,750</em></div><div className="ledger-row"><b className="green"><span>₹</span> Repayment Received</b><span>12 May 2025</span><em className="red">-53,600</em></div><div className="ledger-total"><span>Current Balance</span><strong>₹2,57,650</strong></div></div>
        <div className="flow-badge truck-badge"><span>♧</span><b>GOODS<br />FLOW</b></div><div className="flow-badge money-badge"><span>₹</span><b>MONEY<br />FLOW</b></div>
        <div className="stock-card">
          <h6>STOCK VALUE</h6>
          <span>
            <strong>₹18,74,920</strong>
            <div className="sparkline" />
          </span>
        </div>
        <div className="hero-footer"><div><BoxIcon /><span><b>Live stock insights</b><small>Track inventory in real time</small></span></div><div><LedgerIcon /><span><b>Transparent ledger</b><small>Every transaction, in one place</small></span></div><div><span className="shield">✓</span><span><b>Secure & trusted</b><small>Bank-grade security</small></span></div></div>
      </section>
      {toast && <div className={`login-toast ${toast.type}`} role="status" aria-live="polite"><span>{toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}</span>{toast.message}<button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button></div>}
    </main>
  );
}
