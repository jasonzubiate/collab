import { ZodError } from "zod";
import { auth } from "@/auth";

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return Response.json({ error: message, ...extra }, { status });
}

/** Turn a ZodError into a 400 response with field-level messages. */
export function zodErrorResponse(error: ZodError): Response {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return Response.json(
    { error: "Validation failed", fieldErrors },
    { status: 400 },
  );
}

export type AdminContext = {
  userId: string;
  brandId: string;
  email: string;
};

/**
 * Authoritative admin guard for route handlers. Returns the admin context, or a
 * 401 Response when there is no valid session. Usage:
 *
 *   const ctx = await requireAdmin();
 *   if (ctx instanceof Response) return ctx;
 */
export async function requireAdmin(): Promise<AdminContext | Response> {
  const session = await auth();
  if (!session?.user?.id || !session.user.brandId) {
    return jsonError("Unauthorized", 401);
  }
  return {
    userId: session.user.id,
    brandId: session.user.brandId,
    email: session.user.email ?? "",
  };
}
