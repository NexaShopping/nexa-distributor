import { tokenStore } from "./auth-store";
import type { ApiErrorCode, ApiResponse, PageMeta } from "./types";

export type ApiEvent = { tone: "success" | "error"; message: string };
const apiEventListeners = new Set<(event: ApiEvent) => void>();
export function subscribeApiEvents(listener: (event: ApiEvent) => void) {
  apiEventListeners.add(listener);
  return () => { apiEventListeners.delete(listener); };
}
function emitApiEvent(event: ApiEvent) { apiEventListeners.forEach((listener) => listener(event)); }
function successMessage(path: string) {
  if (path.includes("/cart")) return "Cart updated.";
  if (path.includes("/inventory")) return "Inventory updated.";
  if (path.includes("/accounts")) return "Profile updated.";
  if (path.includes("/orders")) return "Order updated.";
  return "Changes saved.";
}

// The ONLY place fetch is called in this app. Base URL, auth header, and error mapping from
// the response envelope all live here — never call fetch/axios from a component.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestFull<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: PageMeta }> {
  if (!BASE_URL) {
    throw new ApiError("INTERNAL", "NEXT_PUBLIC_API_URL is not set", 0);
  }

  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach the server. Please try again.";
    emitApiEvent({ tone: "error", message });
    throw new ApiError("INTERNAL", message, 0);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    /* empty / non-JSON body handled below */
  }

  if (!res.ok || !body || body.success === false) {
    const err =
      body && body.success === false
        ? body.error
        : { code: "INTERNAL" as ApiErrorCode, message: res.statusText || "Request failed" };
    emitApiEvent({ tone: "error", message: err.message });
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  if (init.method && init.method !== "GET") emitApiEvent({ tone: "success", message: successMessage(path) });

  return { data: body.data, meta: body.meta };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await requestFull<T>(path, init)).data;
}

// For endpoints that respond with a raw file (e.g. CSV/PDF exports) instead of the standard
// { success, data } JSON envelope — request() would fail trying to res.json() a CSV body.
async function download(path: string): Promise<Blob> {
  if (!BASE_URL) throw new ApiError("INTERNAL", "NEXT_PUBLIC_API_URL is not set", 0);
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach the server. Please try again.";
    emitApiEvent({ tone: "error", message });
    throw new ApiError("INTERNAL", message, 0);
  }
  if (!res.ok) {
    let message = res.statusText || "Request failed";
    let code: ApiErrorCode = "INTERNAL";
    try {
      const body = (await res.json()) as ApiResponse<never>;
      if (body.success === false) { message = body.error.message; code = body.error.code; }
    } catch { /* non-JSON error body */ }
    emitApiEvent({ tone: "error", message });
    throw new ApiError(code, message, res.status);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  // Same as `get`, but also surfaces `meta` (cursor pagination) — for list endpoints.
  getPage: <T>(path: string) => requestFull<T>(path),
  download,
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data === undefined ? undefined : JSON.stringify(data) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
