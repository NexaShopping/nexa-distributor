// Response types, hand-written from nexa-docs/docs/API.md. This is the ONLY place API
// response types live in this repo. Adding a field is safe; a rename/removal in API.md means
// updating it here too.

export interface PageMeta {
  cursor?: string;
  hasMore: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

// Stable SCREAMING_SNAKE codes from API.md. Panels switch on `code`, never on `message`.
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "EXTERNAL_SERVICE_ERROR"
  // tolerate codes added server-side before this file catches up
  | (string & {});

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// --- Auth (from API.md · POST /auth/otp/request, POST /auth/otp/verify, GET /auth/me) ---

export type Role = "ADMIN" | "COADMIN" | "DISTRIBUTOR" | "CUSTOMER";
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface AuthAccount {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
}

export interface OtpVerifyResponse {
  token: string;
  expiresAt: string;
  account: AuthAccount;
}

export interface OtpRequestResponse {
  ok: true;
  sent: boolean;
}

export interface MeResponse {
  account: AuthAccount;
}

export interface AccountSummary {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
}

// --- Inventory / storefront browsing (from API.md · GET /inventory?sellerAccountId=) ---

export interface StockItemView {
  id: string;
  variant: {
    id: string;
    sku: string;
    name: string;
    mrp: string;
    product: { id: string; name: string; slug: string; brand: string; media?: { url: string; alt: string | null }[] };
  };
  onHand: number;
  reserved: number;
  available: number;
  sellPrice: string;
  discountPrice: string | null;
  minimumRetailPrice: string | null;
  customerPrice: string | null;
  taxRatePct: string;
  isListed: boolean;
  lowStockAt: number | null;
}

export interface StockLedgerEntry {
  id: string;
  delta: number;
  onHandAfter: number;
  reservedAfter: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  unitCost: string | null;
  batchNo: string | null;
  note: string | null;
  createdAt: string;
}

export interface UpdateStockItemBody {
  sellPrice?: string;
  discountPrice?: string | null;
  taxRatePct?: string;
  isListed?: boolean;
  lowStockAt?: number;
}

export interface RetailPriceRange {
  minimumRetailPrice: string;
  maximumRetailPrice: string;
  mrp: string;
}

export interface AdjustStockBody {
  delta: number;
  reason: "ADJUSTMENT" | "DAMAGE" | "RETURN_IN";
  note?: string;
}

export type CustomerAcquisitionSource = "ORGANIC" | "REFERRAL" | "DISTRIBUTOR_ASSISTED";
export type DistributorCustomerStatus = "ACTIVE" | "BLOCKED";

export interface CustomerRelationship {
  id: string;
  customer: {
    id: string;
    name: string | null;
    phone: string | null;
    status: "ACTIVE" | "SUSPENDED";
  };
  displayName: string | null;
  notes: string | null;
  status: DistributorCustomerStatus;
  acquisitionSource: CustomerAcquisitionSource | null;
  acquiredByAccountId: string | null;
  acquiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerBody {
  phone: string;
  name: string;
  displayName?: string;
  notes?: string;
}

export interface UpdateCustomerBody {
  displayName?: string | null;
  notes?: string | null;
  status?: DistributorCustomerStatus;
}

// --- Cart (from API.md · Cart Phase 4) ---

export interface CartLine {
  id: string;
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  taxAmount: string;
  lineTotal: string;
  available: number;
}

export interface CartView {
  id: string | null;
  sellerAccountId: string;
  status: "ACTIVE";
  items: CartLine[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
}

// --- Orders (from API.md · Cart & Orders Phase 4) ---

export type OrderStatus = "AWAITING_PAYMENT" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type OrderChannel = "WEB" | "APP" | "DISTRIBUTOR_ASSISTED";

export interface OrderAddress {
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface OrderItemView {
  id: string;
  sku: string;
  productName: string;
  variantLabel: string;
  unitPrice: string;
  quantity: number;
  discount: string;
  taxRatePct: string;
  taxAmount: string;
  lineTotal: string;
}

export interface Order {
  id: string;
  orderNo: string;
  buyerAccountId: string;
  sellerAccountId: string;
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PENDING" | "PAID";
  paymentMethod: "COD" | "PHONEPE" | "CREDIT" | null;
  fulfilmentStatus: "PENDING" | "SHIPPED" | "DELIVERED";
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
  currency: string;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  items: OrderItemView[];
  placedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

// --- Trade credit, repayments, and distributor settlements ---

export type CreditAccountStatus = "ACTIVE" | "SUSPENDED";
export interface CreditSummary { accountId: string; distributorAccountId: string; creditLimit: string; currentBalance: string; availableCredit: string; status: CreditAccountStatus; termDays: number; hasOverdueCharges: boolean; nextDueAt: string | null; }
export interface CreditCharge { id: string; orderId: string; principalAmount: string; outstandingAmount: string; dueAt: string; status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "REVERSED"; createdAt: string; updatedAt: string; }
export interface CreditLedgerEntry { id: string; direction: "DEBIT" | "CREDIT"; reason: string; amount: string; balanceAfter: string; sourceType: string; sourceId: string; note: string | null; createdAt: string; }
export interface CreditRepayment { id: string; amount: string; method: "PHONEPE" | "OFFLINE"; status: "PENDING" | "SUCCESS" | "FAILED"; externalReference: string | null; paidAt: string | null; createdAt: string; updatedAt: string; }
export interface DistributorPayable { id: string; orderId: string; distributorAccountId: string; amount: string; status: "HELD" | "PAYABLE" | "PAID"; eligibleAt: string | null; paidAt: string | null; createdAt: string; updatedAt: string; order: { orderNo: string; deliveredAt: string | null; grandTotal: string }; }
export interface DistributorPayout { id: string; distributorAccountId: string; amount: string; method: string; externalReference: string; paidAt: string; createdAt: string; allocations: Array<{ id: string; payableId: string; amount: string; createdAt: string; payable: { orderId: string } }>; }

export interface OrderCheckoutPayment { merchantOrderId: string; status: "PENDING" | "SUCCESS"; redirectUrl: string; }
export interface OrderPaymentStatus { merchantOrderId: string; providerStatus: "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED"; paymentStatus: "UNPAID" | "PENDING" | "PAID"; orderStatus: OrderStatus; redirectUrl: string | null; expiresAt: string | null; verifiedAt: string | null; }
