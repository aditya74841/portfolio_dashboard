/** Same-origin dashboard API proxy; the JWT remains in an HTTP-only cookie. */
export const API_BASE_URL = "/api/backend";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(API_BASE_URL + endpoint, { ...options, headers, credentials: "same-origin", cache: "no-store" });
  const data = await response.json().catch(() => { throw new Error("Failed to parse API response (" + response.status + ")."); });
  if (response.status === 401 && String(data.message || "").startsWith("Not authorized")) window.dispatchEvent(new Event("dashboard:session-expired"));
  if (response.status === 403 && data.message === "PIN_SESSION_EXPIRED") window.dispatchEvent(new Event("dashboard:pin-session-expired"));
  if (!response.ok) throw new Error(data.message || ("Request failed (" + response.status + ")."));
  return data.data as T;
}
