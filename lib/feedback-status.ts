import { env } from "cloudflare:workers";

export const CREATE_FEEDBACK_RESOLUTION_TABLE = `
  CREATE TABLE IF NOT EXISTS feedback_resolution_status (
    feedback_id TEXT PRIMARY KEY NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    resolved_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES deep_user_feedback(id) ON DELETE CASCADE
  )
`;

export async function ensureFeedbackResolutionTable() {
  await env.DB.prepare(CREATE_FEEDBACK_RESOLUTION_TABLE).run();
}

export async function setFeedbackResolved(feedbackId: string, resolved: boolean) {
  await ensureFeedbackResolutionTable();
  const feedback = await env.DB.prepare(
    "SELECT id FROM deep_user_feedback WHERE id = ? LIMIT 1",
  ).bind(feedbackId).first<{ id: string }>();
  if (!feedback) return null;

  await env.DB.prepare(
    `INSERT INTO feedback_resolution_status (feedback_id, resolved, resolved_at, updated_at)
     VALUES (?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
     ON CONFLICT(feedback_id) DO UPDATE SET
       resolved = excluded.resolved,
       resolved_at = excluded.resolved_at,
       updated_at = CURRENT_TIMESTAMP`,
  ).bind(feedbackId, resolved ? 1 : 0, resolved ? 1 : 0).run();

  return env.DB.prepare(
    "SELECT resolved, resolved_at, updated_at FROM feedback_resolution_status WHERE feedback_id = ?",
  ).bind(feedbackId).first<{ resolved: number; resolved_at: string | null; updated_at: string }>();
}
