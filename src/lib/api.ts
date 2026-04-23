export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-server-zni0.onrender.com/api/v1";

/**
 * Enhanced fetch wrapper for API calls with built-in error handling and auth token management.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from local storage (managed by Zustand)
  const authState = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;
  const token = authState ? JSON.parse(authState).state?.token : null;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An error occurred");
  }

  return data.data; // Our ApiResponse structure stores data in .data
}
