"use client";

import { useOrderInvoice } from "@/features/orders/api";
import { Button } from "@/components/ui";

// Shared by both sides of an order — a distributor buying from admin, or selling to their
// own customer — since GET /orders/:id/invoice has the same visibility as the order itself.
// `ready` should be true from SHIPPED onward: the server generates the invoice at shipment
// (dispatch), not delivery — GST law requires the invoice at or before removal of goods.
export function InvoiceDownload({ orderId, ready }: { orderId: string; ready: boolean }) {
  const invoice = useOrderInvoice(orderId, ready);
  if (!ready) return null;
  if (invoice.isLoading) return <Button variant="secondary" size="sm" disabled>Loading invoice…</Button>;
  if (invoice.isError || !invoice.data) return <Button variant="secondary" size="sm" disabled>Preparing invoice…</Button>;
  return (
    <a href={invoice.data.invoice.pdfUrl} target="_blank" rel="noreferrer">
      <Button variant="secondary" size="sm">Download invoice · {invoice.data.invoice.invoiceNo}</Button>
    </a>
  );
}
