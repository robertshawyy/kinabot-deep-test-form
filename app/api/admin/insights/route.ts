import { env } from "cloudflare:workers";
import { hasAdminSession } from "@/lib/admin-auth";
import { deriveFeedbackInsight, type FeedbackInsight } from "@/lib/feedback-insights";

type FeedbackRow = {
  id: string;
  response_json: string;
  created_at: string;
};

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function isAuthorized(request: Request) {
  if (!(await hasAdminSession(request))) return { allowed: false, reason: "password-required" };

  const hostname = new URL(request.url).hostname;
  if (isLocalHost(hostname)) return { allowed: true, reason: "local" };

  const allowedEmails = (env.FEEDBACK_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const viewerEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() ?? "";
  if (allowedEmails.length === 0) return { allowed: false, reason: "not-configured" };
  if (!viewerEmail) return { allowed: false, reason: "sign-in" };
  return { allowed: allowedEmails.includes(viewerEmail), reason: "allowlist" };
}

function parseFeedback(row: FeedbackRow): FeedbackInsight | null {
  try {
    const body = JSON.parse(row.response_json) as Record<string, unknown>;
    return deriveFeedbackInsight(body, row.id, row.created_at);
  } catch {
    return null;
  }
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

export async function GET(request: Request) {
  const authorization = await isAuthorized(request);
  if (!authorization.allowed) {
    const status = authorization.reason === "password-required" || authorization.reason === "sign-in"
      ? 401
      : authorization.reason === "not-configured"
        ? 503
        : 403;
    return Response.json({ error: authorization.reason }, { status });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT id, response_json, created_at
       FROM deep_user_feedback
       ORDER BY created_at DESC`,
    ).all<FeedbackRow>();
    const insights = (result.results ?? []).map(parseFeedback).filter((item): item is FeedbackInsight => Boolean(item));
    const priorityCounts = {
      urgent: insights.filter((item) => item.priority === "urgent").length,
      high: insights.filter((item) => item.priority === "high").length,
      medium: insights.filter((item) => item.priority === "medium").length,
      observe: insights.filter((item) => item.priority === "observe").length,
    };
    const validNps = insights.map((item) => item.nps).filter((score) => score >= 0);
    const averageNps = validNps.length > 0
      ? Math.round((validNps.reduce((sum, score) => sum + score, 0) / validNps.length) * 10) / 10
      : null;

    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        stats: {
          total: insights.length,
          urgent: priorityCounts.urgent,
          needsAction: priorityCounts.urgent + priorityCounts.high,
          averageNps,
          analysisFeedback: insights.filter((item) => item.analysisRelated === "yes").length,
          privacySignals: insights.filter((item) => item.riskFlags.includes("隐私关注") || item.riskFlags.includes("安全复核")).length,
          priorityCounts,
        },
        signals: {
          feedbackTypes: countBy(insights.map((item) => item.feedbackType)).slice(0, 6),
          issueStages: countBy(insights.map((item) => item.issueStage)).slice(0, 6),
          requestedImprovements: countBy(insights.map((item) => item.retentionPriority)).slice(0, 6),
          themes: countBy(insights.flatMap((item) => item.themes)).slice(0, 10),
        },
        insights,
      },
      { headers: { "cache-control": "no-store, private" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    if (message.includes("no such table")) {
      return Response.json({
        generatedAt: new Date().toISOString(),
        stats: {
          total: 0,
          urgent: 0,
          needsAction: 0,
          averageNps: null,
          analysisFeedback: 0,
          privacySignals: 0,
          priorityCounts: { urgent: 0, high: 0, medium: 0, observe: 0 },
        },
        signals: { feedbackTypes: [], issueStages: [], requestedImprovements: [], themes: [] },
        insights: [],
      });
    }
    console.error("Failed to build feedback dashboard", error);
    return Response.json({ error: "dashboard-unavailable" }, { status: 503 });
  }
}
