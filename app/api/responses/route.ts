import { env } from "cloudflare:workers";

const CREATE_RESPONSES_TABLE = `
  CREATE TABLE IF NOT EXISTS deep_test_responses (
    id TEXT PRIMARY KEY NOT NULL,
    participant_code TEXT NOT NULL,
    test_stage TEXT NOT NULL,
    language TEXT NOT NULL,
    overall_rating INTEGER NOT NULL,
    interview_interest TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

type Submission = {
  [key: string]: unknown;
  participantCode?: unknown;
  testStage?: unknown;
  language?: unknown;
  overallRating?: unknown;
  interviewInterest?: unknown;
  contactEmail?: unknown;
  finalConsent?: unknown;
  website?: unknown;
  startedAt?: unknown;
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 60_000) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: Submission;
  try {
    body = (await request.json()) as Submission;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }

  const participantCode = typeof body.participantCode === "string" ? body.participantCode.trim().slice(0, 40) : "";
  const testStage = typeof body.testStage === "string" ? body.testStage.slice(0, 30) : "";
  const language = typeof body.language === "string" ? body.language.slice(0, 20) : "";
  const overallRating = typeof body.overallRating === "number" ? body.overallRating : 0;
  const interviewInterest = typeof body.interviewInterest === "string" ? body.interviewInterest.slice(0, 10) : "no";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  const requiredTextFields = ["role", "ageRange", "device", "priorAiUse", "completionTime", "expectedResult", "valuable", "improvement", "futureUse"];
  const requiredRatings = ["taskEase", "clarityRating", "trustRating", "privacyRating"];
  const hasRequiredText = requiredTextFields.every((key) => typeof body[key] === "string" && body[key].trim().length > 0);
  const hasRequiredRatings = requiredRatings.every((key) => typeof body[key] === "number" && body[key] >= 1 && body[key] <= 7);
  const hasRequiredConsent = ["understoodNonMedical", "voiceConsent", "voluntaryConsent", "privacyReview", "finalConsent"].every((key) => body[key] === true);
  const hasCompletedTasks = Array.isArray(body.completedTasks) && body.completedTasks.length > 0;
  const hasValidNps = typeof body.nps === "number" && body.nps >= 0 && body.nps <= 10;

  if (
    !/^[A-Z0-9_-]{3,40}$/i.test(participantCode) ||
    !testStage ||
    !language ||
    overallRating < 1 ||
    overallRating > 7 ||
    !hasRequiredText ||
    !hasRequiredRatings ||
    !hasRequiredConsent ||
    !hasCompletedTasks ||
    !hasValidNps
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 422 });
  }
  if (startedAt > 0 && Date.now() - startedAt < 4_000) {
    return Response.json({ error: "Submission completed too quickly" }, { status: 422 });
  }
  if (interviewInterest === "yes" && (typeof body.contactEmail !== "string" || !/^\S+@\S+\.\S+$/.test(body.contactEmail))) {
    return Response.json({ error: "A valid contact email is required" }, { status: 422 });
  }

  const id = `KDT-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
  const safeJson = JSON.stringify({ ...body, website: undefined });
  if (safeJson.length > 55_000) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    await env.DB.prepare(CREATE_RESPONSES_TABLE).run();
    await env.DB.prepare(
      `INSERT INTO deep_test_responses
       (id, participant_code, test_stage, language, overall_rating, interview_interest, response_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, participantCode, testStage, language, overallRating, interviewInterest, safeJson)
      .run();
  } catch (error) {
    console.error("Failed to store deep test response", error);
    return Response.json({ error: "Storage unavailable" }, { status: 503 });
  }

  return Response.json({ id }, { status: 201 });
}
