import { env } from "cloudflare:workers";

const DEFAULT_ADMIN_PASSWORD = "xyz123";
const ADMIN_SESSION_LIFETIME = 60 * 60 * 1000;

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function configuredPassword(request: Request) {
  const productionPassword = env.FEEDBACK_ADMIN_PASSWORD?.trim() ?? "";
  return productionPassword || (isLocalRequest(request) ? DEFAULT_ADMIN_PASSWORD : "");
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(`kinabot-feedback-admin:${value}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safelyEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isAdminPasswordConfigured(request: Request) {
  return configuredPassword(request).length > 0;
}

export async function verifyAdminPassword(candidate: string, request: Request) {
  if (!candidate || candidate.length > 256) return false;
  const [candidateDigest, expectedDigest] = await Promise.all([
    digest(candidate),
    digest(configuredPassword(request)),
  ]);
  return safelyEqual(candidateDigest, expectedDigest);
}

export async function hasAdminSession(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const [expiresAtText, nonce, signature] = suppliedToken.split(".");
  const expiresAt = Number(expiresAtText);
  if (!expiresAtText || !nonce || !signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const expectedSignature = await digest(`${configuredPassword(request)}:${expiresAtText}:${nonce}`);
  return safelyEqual(signature, expectedSignature);
}

export async function createAdminSessionToken(request: Request) {
  const expiresAt = String(Date.now() + ADMIN_SESSION_LIFETIME);
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const signature = await digest(`${configuredPassword(request)}:${expiresAt}:${nonce}`);
  return `${expiresAt}.${nonce}.${signature}`;
}
