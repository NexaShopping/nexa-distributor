"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccount, useUpdateAccount } from "@/features/accounts/api";
import { Button, Card, ErrorState, Input, Label, Spinner } from "@/components/ui";
import { ProfileOverview } from "@/features/accounts/profile-overview";

function LegacyProfilePage() {
  const { account } = useAuth();
  const query = useAccount(account?.id ?? "");
  const update = useUpdateAccount(account?.id ?? "");
  const profile = query.data?.account ?? account;
  const [name, setName] = useState(account?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(account?.avatarUrl ?? "");

  if (query.isLoading) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  if (query.isError || !profile) return <ErrorState message="Could not load your profile." onRetry={() => query.refetch()} />;

  return (
    <div className="profile-modern mx-auto max-w-5xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link><span>›</span><strong className="font-medium text-ink">Profile</strong>
      </nav>
      <Card className="profile-modern__card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-brand/10 text-lg font-semibold text-brand">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (name || profile.phone || "D").slice(0, 1).toUpperCase()}</div>
          <div><h1 className="text-lg font-semibold">Profile details</h1><p className="mt-1 text-sm text-ink-soft">Update the details shown across your distributor workspace.</p></div>
        </div>
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); update.mutate({ name: name.trim() || undefined, avatarUrl: avatarUrl.trim() || null }); }}>
          <div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></div>
          <div><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" value={profile.phone ?? ""} disabled /></div>
          <div><Label htmlFor="profile-avatar">Avatar URL</Label><Input id="profile-avatar" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" /></div>
          <div className="flex justify-end pt-2"><Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save profile"}</Button></div>
        </form>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const { account } = useAuth();
  if (!account) return <div className="grid place-items-center py-20 text-ink-soft"><Spinner className="h-5 w-5" /></div>;
  return <ProfileOverview account={account} />;
}
