import { hasAdminSession } from "@/lib/admin-auth";
import { setFeedbackResolved } from "@/lib/feedback-status";

export async function PATCH(request: Request) {
  if (!(await hasAdminSession(request))) {
    return Response.json(
      { error: "password-required" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  let body: { feedbackId?: unknown; resolved?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ error: "invalid-request" }, { status: 400 });
  }

  const feedbackId = typeof body.feedbackId === "string" ? body.feedbackId.trim() : "";
  if (!/^KFB-[A-F0-9]{8,12}$/.test(feedbackId) || typeof body.resolved !== "boolean") {
    return Response.json({ error: "invalid-status" }, { status: 400 });
  }

  try {
    const status = await setFeedbackResolved(feedbackId, body.resolved);
    if (!status) return Response.json({ error: "feedback-not-found" }, { status: 404 });
    return Response.json(
      {
        feedbackId,
        resolved: status.resolved === 1,
        resolvedAt: status.resolved_at,
        updatedAt: status.updated_at,
      },
      { headers: { "cache-control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Failed to update feedback resolution status", error);
    return Response.json({ error: "status-unavailable" }, { status: 503 });
  }
}
