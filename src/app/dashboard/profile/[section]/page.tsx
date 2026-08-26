"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui";

const sections = {
  business: { title: "Business details", description: "Manage your company information and distributor identity.", items: ["Business name", "Territory", "GST / tax details", "Business address"] },
  security: { title: "Security & sessions", description: "Manage authentication and active sessions.", items: ["Password and two-factor authentication", "Active sessions", "Sign out of other devices"] },
  notifications: { title: "Notifications", description: "Choose which workspace alerts you receive.", items: ["Order updates", "Payment reminders", "Low-stock alerts", "Email and push preferences"] },
} as const;

export default function ProfileSectionPage() {
  const { section } = useParams<{ section: string }>();
  const content = sections[section as keyof typeof sections] ?? sections.business;
  return <div className="profile-section-page"><Link className="profile-section-page__back" href="/dashboard/profile">← Back to profile</Link><Card className="profile-section-page__card"><div className="profile-section-page__icon">✦</div><h1>{content.title}</h1><p>{content.description}</p><div className="profile-section-page__items">{content.items.map((item) => <div key={item}><span>{item}</span><b>›</b></div>)}</div><small>These profile controls are ready to be configured in the next profile settings update.</small></Card></div>;
}
