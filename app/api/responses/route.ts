import { env } from "cloudflare:workers";
import { deriveFeedbackInsight } from "@/lib/feedback-insights";

const CREATE_FEEDBACK_TABLE = `
  CREATE TABLE IF NOT EXISTS deep_user_feedback (
    id TEXT PRIMARY KEY NOT NULL,
    feedback_type TEXT NOT NULL,
    task_outcome TEXT NOT NULL,
    impact TEXT NOT NULL,
    analysis_related TEXT NOT NULL,
    nps INTEGER NOT NULL,
    technical_info_consent INTEGER NOT NULL DEFAULT 0,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_INSIGHTS_TABLE = `
  CREATE TABLE IF NOT EXISTS feedback_insights (
    feedback_id TEXT PRIMARY KEY NOT NULL,
    priority_level TEXT NOT NULL,
    priority_score INTEGER NOT NULL,
    headline TEXT NOT NULL,
    essence TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    themes_json TEXT NOT NULL,
    risk_flags_json TEXT NOT NULL,
    insight_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

type Submission = Record<string, unknown>;

const requiredStrings = [
  "feedbackType",
  "issueStage",
  "taskOutcome",
  "actualEvent",
  "expectedEvent",
  "frequency",
  "impact",
  "analysisRelated",
  "metricsUnderstanding",
  "scoreDirectionUnderstanding",
  "transcriptPreviewPreference",
  "calculationBasisPreference",
  "selfUnderstandingValue",
  "wellnessAdviceValue",
  "boundaryNonMedical",
  "boundarySampleOnly",
  "boundaryNoMedicalDecision",
  "screenshotWillingness",
  "anonymousTechConsent",
  "topImprovement",
  "retentionPriority",
  "usageFrequency",
  "followUpPreference",
];

const requiredArrays = ["attemptedTasks", "troubleshooting", "privacyConcerns"];

function isNonEmptyText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function exceedsTextLimit(body: Submission) {
  const limits: Record<string, number> = {
    actualEvent: 500,
    expectedEvent: 300,
    surprisingResult: 300,
    privacyDetail: 500,
    topImprovement: 300,
    otherFeedback: 500,
  };
  return Object.entries(limits).some(([key, limit]) => typeof body[key] === "string" && body[key].length > limit);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 70_000) return Response.json({ error: "Payload too large" }, { status: 413 });

  let body: Submission;
  try {
    body = (await request.json()) as Submission;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) return Response.json({ error: "Invalid submission" }, { status: 400 });

  const hasRequiredStrings = requiredStrings.every((key) => isNonEmptyText(body[key]));
  const hasRequiredArrays = requiredArrays.every((key) => Array.isArray(body[key]) && body[key].length > 0);
  const nps = typeof body.nps === "number" ? body.nps : -1;
  const analysisRelated = typeof body.analysisRelated === "string" ? body.analysisRelated : "";
  const hasAnalysisDetails = analysisRelated !== "yes" || (
    Array.isArray(body.affectedMetrics) && body.affectedMetrics.length > 0 &&
    Array.isArray(body.metricIssueTypes) && body.metricIssueTypes.length > 0 &&
    ["recordingMethod", "recordingLanguage", "recordingDuration", "recordingEnvironment", "obviousPauses", "multipleSpeakers", "speakingStyle", "transcriptionAccuracy"].every((key) => isNonEmptyText(body[key]))
  );

  if (
    !hasRequiredStrings ||
    !hasRequiredArrays ||
    !hasAnalysisDetails ||
    nps < 0 ||
    nps > 10 ||
    body.sensitiveInfoConfirmation !== true ||
    body.nonMedicalConfirmation !== true ||
    exceedsTextLimit(body)
  ) {
    return Response.json({ error: "Missing or invalid required fields" }, { status: 422 });
  }

  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (startedAt > 0 && Date.now() - startedAt < 4_000) {
    return Response.json({ error: "Submission completed too quickly" }, { status: 422 });
  }

  const safeBody: Submission = { ...body, website: undefined };
  const technicalInfoConsent = body.anonymousTechConsent === "yes" ? 1 : 0;
  if (!technicalInfoConsent) delete safeBody.technicalContext;
  const safeJson = JSON.stringify(safeBody);
  if (safeJson.length > 65_000) return Response.json({ error: "Payload too large" }, { status: 413 });

  const id = `KFB-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
  const feedbackType = String(body.feedbackType).slice(0, 80);
  const taskOutcome = String(body.taskOutcome).slice(0, 80);
  const impact = String(body.impact).slice(0, 100);
  const insight = deriveFeedbackInsight(safeBody, id);

  try {
    await env.DB.prepare(CREATE_FEEDBACK_TABLE).run();
    await env.DB.prepare(CREATE_INSIGHTS_TABLE).run();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO deep_user_feedback
         (id, feedback_type, task_outcome, impact, analysis_related, nps, technical_info_consent, response_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, feedbackType, taskOutcome, impact, analysisRelated, nps, technicalInfoConsent, safeJson),
      env.DB.prepare(
        `INSERT INTO feedback_insights
         (feedback_id, priority_level, priority_score, headline, essence, recommended_action, themes_json, risk_flags_json, insight_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        insight.priority,
        insight.priorityScore,
        insight.headline,
        insight.essence,
        insight.recommendedAction,
        JSON.stringify(insight.themes),
        JSON.stringify(insight.riskFlags),
        JSON.stringify(insight),
      ),
    ]);
  } catch (error) {
    console.error("Failed to store deep user feedback", error);
    return Response.json({ error: "Storage unavailable" }, { status: 503 });
  }

  return Response.json({ id }, { status: 201 });
}
