import test from "node:test";
import assert from "node:assert/strict";
import { prepareCashEntry } from "./submission.ts";

test("one cash handover produces one dated entry payload with the retry key", () => {
  assert.deepEqual(prepareCashEntry({
    customerAccountId: "customer-1",
    amount: "2000",
    cashReceivedAt: "2026-10-17T14:30+05:30",
    notes: "Cash received",
  }, "retry-1"), {
    customerAccountId: "customer-1",
    amount: "2000.00",
    cashReceivedAt: "2026-10-17T09:00:00.000Z",
    notes: "Cash received",
    idempotencyKey: "retry-1",
  });
});

test("rejects zero, negative, and overprecise amounts", () => {
  for (const amount of ["0", "-10", "12.345", "abc"]) {
    assert.throws(() => prepareCashEntry({ customerAccountId: "customer-1", amount, cashReceivedAt: "2026-10-17T14:30" }, "retry-1"));
  }
});

test("rejects a missing customer or invalid cash date", () => {
  assert.throws(() => prepareCashEntry({ customerAccountId: "", amount: "10", cashReceivedAt: "2026-10-17T14:30" }, "retry-1"));
  assert.throws(() => prepareCashEntry({ customerAccountId: "customer-1", amount: "10", cashReceivedAt: "not a date" }, "retry-1"));
});

test("interprets the collection form's local time as IST", () => {
  assert.equal(prepareCashEntry({ customerAccountId: "customer-1", amount: "10", cashReceivedAt: "2026-10-17T14:30" }, "retry-1").cashReceivedAt, "2026-10-17T09:00:00.000Z");
});
