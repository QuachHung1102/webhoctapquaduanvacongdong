/**
 * lib/validation.ts
 * Pure input helpers for route handlers — no Prisma / Next imports, so they
 * are safe on the edge runtime and testable with `tsx --test`.
 */

/** Parses a JSON object body; invalid JSON, arrays and primitives yield {}. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Trimmed string, or "" when the value is not a string. */
export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Type guard for a Prisma enum object (e.g. `isOneOf(TaskStatus, body.status)`). */
export function isOneOf<T extends string>(values: Record<string, T>, value: unknown): value is T {
  return Object.values(values).includes(value as T);
}

/** Valid Date from a non-empty string, otherwise null. */
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normalises an optional, user-supplied URL that will be stored and rendered.
 * ""/null/undefined → null (clear). http(s) URL or site-relative "/path" → trimmed string.
 * Anything else (javascript:, data:, "//host", non-string) → undefined, meaning "reject".
 */
export function parseOptionalUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const url = value.trim();
  if (!url) return null;
  // "/\host" is treated as "//host" by browsers, so it is rejected too.
  if (url.startsWith("/")) return /^\/(?![/\\])/.test(url) ? url : undefined;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

/** Password rule shared by change-password and reset. Returns a Vietnamese error, or null when valid. */
export function passwordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "Mật khẩu mới phải có ít nhất 8 ký tự.";
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Mật khẩu mới phải có ít nhất 1 chữ hoa và 1 chữ số.";
  }
  return null;
}

/** Username slug from an email local part: "Mentor.Hung@x.vn" → "mentor-hung". */
export function usernameBase(email: string): string {
  const slug = email
    .split("@")[0]
    .toLowerCase()
    .replace(/\./g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "user";
}

/** First free username: base, then base-2, base-3, … */
export function uniqueUsername(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
