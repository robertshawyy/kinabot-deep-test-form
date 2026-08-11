export type InsightPriority = "urgent" | "high" | "medium" | "observe";

export type FeedbackInsight = {
  id: string;
  priority: InsightPriority;
  priorityScore: number;
  headline: string;
  essence: string;
  recommendedAction: string;
  themes: string[];
  riskFlags: string[];
  feedbackType: string;
  issueStage: string;
  taskOutcome: string;
  impact: string;
  frequency: string;
  actualEvent: string;
  expectedEvent: string;
  topImprovement: string;
  retentionPriority: string;
  analysisRelated: string;
  nps: number;
  createdAt: string;
};

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function list(body: Record<string, unknown>, key: string) {
  return Array.isArray(body[key])
    ? body[key].filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function shorten(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function deriveFeedbackInsight(
  body: Record<string, unknown>,
  id: string,
  createdAt = new Date().toISOString(),
): FeedbackInsight {
  const feedbackType = text(body, "feedbackType") || "未分类反馈";
  const issueStage = text(body, "issueStage") || "位置不确定";
  const taskOutcome = text(body, "taskOutcome");
  const impact = text(body, "impact");
  const frequency = text(body, "frequency");
  const actualEvent = text(body, "actualEvent");
  const expectedEvent = text(body, "expectedEvent");
  const topImprovement = text(body, "topImprovement");
  const retentionPriority = text(body, "retentionPriority");
  const analysisRelated = text(body, "analysisRelated");
  const affectedMetrics = list(body, "affectedMetrics").filter((item) => item !== "不确定");
  const metricIssues = list(body, "metricIssueTypes");
  const privacyConcerns = list(body, "privacyConcerns").filter((item) => item !== "没有这方面的顾虑");
  const nps = typeof body.nps === "number" ? body.nps : -1;

  let score = 0;
  if (impact === "无法继续使用") score += 5;
  else if (impact.includes("信任")) score += 4;
  else if (impact.includes("明显影响")) score += 3;
  else if (impact.includes("轻微")) score += 1;
  if (taskOutcome === "完全无法完成") score += 3;
  else if (taskOutcome === "只完成了一部分") score += 1;
  if (frequency === "每次都会出现") score += 2;
  else if (frequency === "经常出现") score += 1;
  if (feedbackType.includes("隐私") || feedbackType.includes("安全")) score += 2;
  if (privacyConcerns.some((item) => item.includes("安全问题"))) score += 3;
  if (metricIssues.some((item) => item.includes("医疗") || item.includes("认知判断"))) score += 2;
  if (feedbackType === "正面反馈") score = Math.max(0, score - 2);
  score = Math.min(10, score);

  const priority: InsightPriority = score >= 8 ? "urgent" : score >= 6 ? "high" : score >= 3 ? "medium" : "observe";
  const riskFlags = unique([
    taskOutcome === "完全无法完成" ? "任务阻断" : "",
    impact.includes("信任") ? "信任风险" : "",
    feedbackType.includes("隐私") || privacyConcerns.length > 0 ? "隐私关注" : "",
    privacyConcerns.some((item) => item.includes("安全问题")) ? "安全复核" : "",
    metricIssues.some((item) => item.includes("医疗") || item.includes("认知判断")) ? "医疗边界误读" : "",
    text(body, "transcriptionAccuracy").includes("很多错误") || text(body, "transcriptionAccuracy") === "完全错误" ? "转写质量" : "",
  ]);

  let headline = `${issueStage}：${feedbackType}`;
  if (riskFlags.includes("安全复核")) headline = "需要优先复核的隐私 / 安全反馈";
  else if (taskOutcome === "完全无法完成") headline = `${issueStage}阻断了任务完成`;
  else if (analysisRelated === "yes" && affectedMetrics.length > 0) headline = `${affectedMetrics[0]}结果需要复核`;

  const essenceParts = [
    actualEvent ? `发生：${shorten(actualEvent, 115)}` : "",
    expectedEvent ? `期待：${shorten(expectedEvent, 85)}` : "",
  ].filter(Boolean);
  const essence = essenceParts.join(" · ") || "用户未提供开放文本描述。";
  const recommendedAction = shorten(topImprovement || retentionPriority || expectedEvent || "需要维护团队进一步复核", 180);
  const themes = unique([feedbackType, issueStage, retentionPriority, ...affectedMetrics.slice(0, 2), ...privacyConcerns.slice(0, 1)]).slice(0, 7);

  return {
    id,
    priority,
    priorityScore: score,
    headline,
    essence,
    recommendedAction,
    themes,
    riskFlags,
    feedbackType,
    issueStage,
    taskOutcome,
    impact,
    frequency,
    actualEvent,
    expectedEvent,
    topImprovement,
    retentionPriority,
    analysisRelated,
    nps,
    createdAt,
  };
}
