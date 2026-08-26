import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "NexaShopping Distributor",
  description: "Distributor panel for the NexaShopping distribution platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
