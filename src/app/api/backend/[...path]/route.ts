import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dashboard_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const LOGIN_PATHS = new Set(["auth/email-login", "auth/google", "auth/register"]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const method = request.method.toUpperCase();
  if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return NextResponse.json({ success: false, message: "Method not allowed" }, { status: 405 });
  }

  if (!["GET", "HEAD"].includes(method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ success: false, message: "Cross-origin request rejected" }, { status: 403 });
    }
  }

  const { path } = await context.params;
  const endpoint = path.join("/");
  const configuredApiUrl = process.env.PORTFOLIO_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://portfolio-server-zni0.onrender.com/api/v1";
  const upstreamUrl = `${configuredApiUrl.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (cookieToken) headers.set("authorization", `Bearer ${cookieToken}`);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ success: false, message: "Authentication service is unavailable. Please try again." }, { status: 502 });
  }

  const responseText = method === "HEAD" ? "" : await upstream.text();
  let payload: any = null;
  try { payload = responseText ? JSON.parse(responseText) : null; } catch { /* preserve non-JSON upstream responses */ }

  let issuedToken: string | undefined;
  if (upstream.ok && LOGIN_PATHS.has(endpoint) && payload?.data?.token) {
    issuedToken = payload.data.token;
    delete payload.data.token;
  }

  const responseHeaders = new Headers();
  const responseType = upstream.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);
  responseHeaders.set("cache-control", "no-store");
  const responseBody = payload === null ? responseText : JSON.stringify(payload);
  const response = new NextResponse(responseBody, { status: upstream.status, headers: responseHeaders });

  if (issuedToken) {
    response.cookies.set(SESSION_COOKIE, issuedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  } else if (endpoint === "auth/logout" || (endpoint === "auth/change-password" && upstream.ok) || (upstream.status === 401 && String(payload?.message || "").startsWith("Not authorized"))) {
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  }

  return response;
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const runtime = "nodejs";
