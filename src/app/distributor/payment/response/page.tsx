import { PhonePePaymentResponse } from "@/features/orders/payment-actions";

export default async function PaymentResponsePage({ searchParams }: { searchParams: Promise<{ merchantOrderId?: string | string[] }> }) {
  const value = (await searchParams).merchantOrderId;
  return <main className="mx-auto grid min-h-screen max-w-xl place-items-center p-6"><PhonePePaymentResponse merchantOrderId={Array.isArray(value) ? value[0] : value} /></main>;
}
