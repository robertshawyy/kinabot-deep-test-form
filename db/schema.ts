import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const deepTestResponses = sqliteTable("deep_test_responses", {
  id: text("id").primaryKey(),
  participantCode: text("participant_code").notNull(),
  testStage: text("test_stage").notNull(),
  language: text("language").notNull(),
  overallRating: integer("overall_rating").notNull(),
  interviewInterest: text("interview_interest").notNull().default("no"),
  responseJson: text("response_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const deepUserFeedback = sqliteTable("deep_user_feedback", {
  id: text("id").primaryKey(),
  feedbackType: text("feedback_type").notNull(),
  taskOutcome: text("task_outcome").notNull(),
  impact: text("impact").notNull(),
  analysisRelated: text("analysis_related").notNull(),
  nps: integer("nps").notNull(),
  technicalInfoConsent: integer("technical_info_consent").notNull().default(0),
  responseJson: text("response_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const feedbackInsights = sqliteTable("feedback_insights", {
  feedbackId: text("feedback_id").primaryKey(),
  priorityLevel: text("priority_level").notNull(),
  priorityScore: integer("priority_score").notNull(),
  headline: text("headline").notNull(),
  essence: text("essence").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  themesJson: text("themes_json").notNull(),
  riskFlagsJson: text("risk_flags_json").notNull(),
  insightJson: text("insight_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
