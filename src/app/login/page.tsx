"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Indian E.164, entered as a 10-digit local number — the +91 is fixed since distributors are
// onboarded by admin with Indian numbers today. Revisit if that assumption ever changes.
function toE164(local: string): string {
  return `+91${local.replace(/\D/g, "")}`;
}

export default function LoginPage() {
  const { status, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
  }, [status, router]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestOtp(toE164(phone));
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(toE164(phone), otp);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "NOT_FOUND"
            ? "No distributor account found for this phone number."
            : err.code === "FORBIDDEN"
              ? "This account isn't active yet — contact NexaShopping support."
              : err.code === "UNAUTHENTICATED"
                ? "That code is incorrect."
                : err.message,
        );
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={32} height={31} className="h-8 w-auto" />
          <span className="text-lg font-semibold tracking-tight">
            Nexa<span className="text-brand">Shopping</span>
          </span>
        </div>

        <h1 className="mt-8 text-xl font-semibold">Distributor sign in</h1>

        {step === "phone" ? (
          <>
            <p className="mt-1.5 text-sm text-ink-soft">
              Enter the phone number registered with NexaShopping.
            </p>
            <form onSubmit={handleSendCode} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Phone number</label>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 items-center rounded-md border border-line bg-canvas px-3 text-sm text-ink-soft">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    required
                    className="h-11 flex-1 rounded-md border border-line bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy || phone.length !== 10}
                className="flex h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-ink-soft">
              Enter the 6-digit code sent to +91 {phone}.
            </p>
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                  className="h-11 w-full rounded-md border border-line bg-surface px-3 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="flex h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify & sign in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
                className="w-full text-center text-sm text-ink-soft hover:text-ink"
              >
                Use a different number
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
