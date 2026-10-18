export interface CashEntryInput {
  customerAccountId: string;
  amount: string;
  cashReceivedAt: string;
  notes?: string;
}

export function prepareCashEntry(input: CashEntryInput, idempotencyKey: string) {
  if (!input.customerAccountId.trim()) throw new Error("Select a customer.");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input.amount.trim()) || !/[1-9]/.test(input.amount)) {
    throw new Error("Enter an amount greater than zero with at most two decimal places.");
  }
  const receivedAt = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(input.cashReceivedAt) ? input.cashReceivedAt : `${input.cashReceivedAt}+05:30`);
  if (Number.isNaN(receivedAt.getTime())) throw new Error("Enter a valid cash collection date.");
  if (!idempotencyKey.trim()) throw new Error("Please try again.");
  const [rupees, paise = ""] = input.amount.trim().split(".");
  const notes = input.notes?.trim();
  return {
    customerAccountId: input.customerAccountId,
    amount: `${rupees}.${paise.padEnd(2, "0")}`,
    cashReceivedAt: receivedAt.toISOString(),
    ...(notes ? { notes } : {}),
    idempotencyKey,
  };
}
