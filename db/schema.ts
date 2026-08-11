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
