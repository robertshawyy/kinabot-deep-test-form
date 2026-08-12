import { env } from "cloudflare:workers";
import { hasAdminSession } from "@/lib/admin-auth";
import { deriveFeedbackInsight, type FeedbackInsight } from "@/lib/feedback-insights";
import { ensureFeedbackResolutionTable } from "@/lib/feedback-status";

type FeedbackRow = {
  id: string;
  response_json: string;
  created_at: string;
  resolved: number;
  resolved_at: string | null;
};

type DashboardInsight = FeedbackInsight & { resolved: boolean; resolvedAt: string | null };

function parseFeedback(row: FeedbackRow): DashboardInsight | null {
  try {
    const body = JSON.parse(row.response_json) as Record<string, unknown>;
    return {
      ...deriveFeedbackInsight(body, row.id, row.created_at),
      resolved: row.resolved === 1,
      resolvedAt: row.resolved_at,
    };
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
  if (!(await hasAdminSession(request))) {
    return Response.json(
      { error: "password-required" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    await ensureFeedbackResolutionTable();
    const result = await env.DB.prepare(
      `SELECT feedback.id, feedback.response_json, feedback.created_at,
              COALESCE(status.resolved, 0) AS resolved, status.resolved_at
       FROM deep_user_feedback AS feedback
       LEFT JOIN feedback_resolution_status AS status ON status.feedback_id = feedback.id
       ORDER BY feedback.created_at DESC`,
    ).all<FeedbackRow>();
    const insights = (result.results ?? []).map(parseFeedback).filter((item): item is DashboardInsight => Boolean(item));
    const unresolvedInsights = insights.filter((item) => !item.resolved);
    const priorityCounts = {
      urgent: unresolvedInsights.filter((item) => item.priority === "urgent").length,
      high: unresolvedInsights.filter((item) => item.priority === "high").length,
      medium: unresolvedInsights.filter((item) => item.priority === "medium").length,
      observe: unresolvedInsights.filter((item) => item.priority === "observe").length,
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
          unresolved: unresolvedInsights.length,
          resolved: insights.length - unresolvedInsights.length,
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
          unresolved: 0,
          resolved: 0,
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
