/**
 * Self-contained Google OAuth + JWT session auth.
 * Works on any domain — Vercel, Cloudflare, etc.
 */

const SESSION_COOKIE = "lc_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface SessionUser {
  id: string;       // Google sub
  email: string;
  name: string | null;
  avatar_url: string | null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function asBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// ── JWT (HS256) ───────────────────────────────────────────────────────────────

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = base64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body   = base64url(encoder.encode(JSON.stringify(payload)));
  const sig    = base64url(new Uint8Array(await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(`${header}.${body}`))));
  return `${header}.${body}.${sig}`;
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const valid = await crypto.subtle.verify("HMAC", await signingKey(secret), asBuffer(decodeBase64url(sig)), encoder.encode(`${header}.${body}`));
  if (!valid) return null;
  try {
    const payload = JSON.parse(decoder.decode(decodeBase64url(body))) as Record<string, unknown>;
    if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── cookie helpers ────────────────────────────────────────────────────────────

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function sessionCookie(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;
}

// ── config ────────────────────────────────────────────────────────────────────

function getConfig() {
  const clientId     = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const jwtSecret    = process.env.JWT_SECRET?.trim() ?? process.env.AUTH_APP_TRANSACTION_SECRET?.trim();
  if (!clientId || !clientSecret || !jwtSecret || encoder.encode(jwtSecret).byteLength < 16) {
    throw new Error("auth_configuration_error");
  }
  return { clientId, clientSecret, jwtSecret };
}

function getPublicOrigin(req: Request): string {
  // Vercel sets x-forwarded-host
  const fwdHost = req.headers.get("x-forwarded-host");
  if (fwdHost) return `https://${fwdHost.split(",")[0].trim()}`;
  const url = new URL(req.url);
  if (url.hostname !== "localhost" && url.protocol === "https:") return url.origin;
  // fallback for localhost dev
  return url.origin;
}

// ── public API ────────────────────────────────────────────────────────────────

/** Redirect browser to Google login */
export async function handleGoogleLogin(req: Request): Promise<Response> {
  try {
    const { clientId, jwtSecret } = getConfig();
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = base64url(crypto.getRandomValues(new Uint8Array(24)));

    // Store state + redirectUri in a short-lived cookie so callback can verify
    const stateCookie = await signJwt({ state, redirectUri, iat: Date.now() }, jwtSecret);

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");

    const headers = new Headers({ Location: url.toString(), "Cache-Control": "no-store" });
    headers.append("Set-Cookie", `lc_oauth_state=${encodeURIComponent(stateCookie)}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
    return new Response(null, { status: 302, headers });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** Handle Google OAuth callback */
export async function handleGoogleCallback(
  req: Request,
  onUser: (user: SessionUser) => Promise<void>
): Promise<Response> {
  try {
    const { clientId, clientSecret, jwtSecret } = getConfig();
    const url = new URL(req.url);
    const code  = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return Response.json({ error: "missing_code_or_state" }, { status: 400 });

    // Verify state
    const rawState = readCookie(req, "lc_oauth_state");
    if (!rawState) return Response.json({ error: "missing_state_cookie" }, { status: 400 });
    const stateClaims = await verifyJwt(decodeURIComponent(rawState), jwtSecret);
    if (!stateClaims || stateClaims.state !== state) return Response.json({ error: "invalid_state" }, { status: 400 });

    const redirectUri = stateClaims.redirectUri as string;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return Response.json({ error: "token_exchange_failed", detail: t.slice(0, 200) }, { status: 502 });
    }
    const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };

    // Get user info
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return Response.json({ error: "userinfo_failed" }, { status: 502 });
    const info = (await infoRes.json()) as { sub?: string; email?: string; name?: string; picture?: string };
    if (!info.sub) return Response.json({ error: "no_sub" }, { status: 502 });

    const sessionUser: SessionUser = {
      id: info.sub,
      email: info.email ?? `${info.sub}@noemail.local`,
      name: info.name ?? null,
      avatar_url: info.picture ?? null,
    };

    await onUser(sessionUser);

    // Issue session JWT
    const jwt = await signJwt({
      sub: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      avatar: sessionUser.avatar_url,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    }, jwtSecret);

    const completionHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
if(window.opener){window.opener.postMessage({type:"lc:auth-complete"},"*");window.close();}
else{window.location.replace("/");}
</script>
</body></html>`;

    const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    headers.append("Set-Cookie", sessionCookie(jwt, SESSION_TTL));
    headers.append("Set-Cookie", `lc_oauth_state=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`);
    return new Response(completionHtml, { status: 200, headers });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

/** Read current session from cookie */
export async function getSession(req: Request): Promise<SessionUser | null> {
  try {
    const { jwtSecret } = getConfig();
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) return null;
    const claims = await verifyJwt(decodeURIComponent(token), jwtSecret);
    if (!claims?.sub) return null;
    return {
      id: claims.sub as string,
      email: (claims.email as string) ?? "",
      name: (claims.name as string | null) ?? null,
      avatar_url: (claims.avatar as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** /api/auth/me handler */
export async function handleMe(req: Request): Promise<Response> {
  const user = await getSession(req);
  if (!user) return Response.json({ error: "unauthenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ user: { openid: user.id, email: user.email, display_name: user.name, avatar_url: user.avatar_url }, csrf_token: "n/a" }, {
    status: 200, headers: { "Cache-Control": "no-store" },
  });
}

/** /api/auth/logout handler */
export async function handleLogout(_req: Request): Promise<Response> {
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearSessionCookie());
  return new Response(null, { status: 204, headers });
}
