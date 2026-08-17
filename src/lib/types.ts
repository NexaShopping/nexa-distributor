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
    product: { id: string; name: string; slug: string; brand: string };
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
  paymentStatus: "UNPAID";
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
