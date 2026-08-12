"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Priority = "urgent" | "high" | "medium" | "observe";
type InsightFilter = "all" | Priority | "resolved";

type Insight = {
  id: string;
  priority: Priority;
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
  resolved: boolean;
  resolvedAt: string | null;
};

type Signal = { name: string; count: number };

type DashboardData = {
  generatedAt: string;
  stats: {
    total: number;
    unresolved: number;
    resolved: number;
    urgent: number;
    needsAction: number;
    averageNps: number | null;
    analysisFeedback: number;
    privacySignals: number;
    priorityCounts: Record<Priority, number>;
  };
  signals: {
    feedbackTypes: Signal[];
    issueStages: Signal[];
    requestedImprovements: Signal[];
    themes: Signal[];
  };
  insights: Insight[];
};

const priorityLabels: Record<Priority, string> = {
  urgent: "立即复核",
  high: "优先处理",
  medium: "计划改进",
  observe: "持续观察",
};

function unresolvedPriorityCounts(insights: Insight[]): Record<Priority, number> {
  const unresolved = insights.filter((item) => !item.resolved);
  return {
    urgent: unresolved.filter((item) => item.priority === "urgent").length,
    high: unresolved.filter((item) => item.priority === "high").length,
    medium: unresolved.filter((item) => item.priority === "medium").length,
    observe: unresolved.filter((item) => item.priority === "observe").length,
  };
}

function formatDate(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function escapeCsv(value: string | number | null) {
  const text = value === null ? "" : String(value);
  const formulaSafeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${formulaSafeText.replaceAll('"', '""')}"`;
}

function SignalList({ title, subtitle, items }: { title: string; subtitle: string; items: Signal[] }) {
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="signal-card">
      <div className="signal-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><span>{items.reduce((sum, item) => sum + item.count, 0)}</span></div>
      {items.length === 0 ? <p className="signal-empty">等待更多反馈</p> : (
        <div className="signal-list">
          {items.map((item) => (
            <div className="signal-row" key={item.name}>
              <div><span>{item.name}</span><strong>{item.count}</strong></div>
              <i><b style={{ width: `${(item.count / maximum) * 100}%` }} /></i>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function FeedbackAdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"" | "password" | "load">("password");
  const [filter, setFilter] = useState<InsightFilter>("all");
  const [copyState, setCopyState] = useState("复制洞察摘要");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [resolutionError, setResolutionError] = useState("");

  const loadDashboard = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/admin/insights", {
        cache: "no-store",
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        setError("password");
        return;
      }
      if (!response.ok) throw new Error("dashboard request failed");
      const result = await response.json() as DashboardData;
      setData(result);
      setError("");
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigningIn(true);
    setPasswordError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setPasswordError(response.status === 401 ? "密码不正确，请重新输入。" : response.status === 503 ? "线上维护密码尚未配置。" : "暂时无法验证，请稍后再试。");
        return;
      }
      const result = await response.json() as { token?: string };
      if (!result.token) {
        setPasswordError("暂时无法验证，请稍后再试。");
        return;
      }
      setPassword("");
      setError("");
      setLoading(true);
      setSessionToken(result.token);
    } catch {
      setPasswordError("暂时无法验证，请稍后再试。");
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = () => {
    setSessionToken("");
    setData(null);
    setPassword("");
    setPasswordError("");
    setError("password");
  };

  useEffect(() => {
    if (!sessionToken) return;
    const initialTimer = window.setTimeout(() => void loadDashboard(sessionToken), 0);
    const refreshTimer = window.setInterval(() => void loadDashboard(sessionToken), 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadDashboard, sessionToken]);

  useEffect(() => {
    const clearSession = () => signOut();
    const clearRestoredSession = (event: PageTransitionEvent) => {
      if (event.persisted) clearSession();
    };
    window.addEventListener("pagehide", clearSession);
    window.addEventListener("pageshow", clearRestoredSession);
    return () => {
      window.removeEventListener("pagehide", clearSession);
      window.removeEventListener("pageshow", clearRestoredSession);
    };
  }, []);

  const visibleInsights = useMemo(() => {
    if (!data) return [];
    if (filter === "resolved") return data.insights.filter((item) => item.resolved);
    const unresolved = data.insights.filter((item) => !item.resolved);
    return filter === "all" ? unresolved : unresolved.filter((item) => item.priority === filter);
  }, [data, filter]);

  const toggleResolution = async (item: Insight) => {
    if (updatingIds.includes(item.id)) return;
    setUpdatingIds((current) => [...current, item.id]);
    setResolutionError("");
    try {
      const response = await fetch("/api/admin/feedback-status", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${sessionToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ feedbackId: item.id, resolved: !item.resolved }),
      });
      if (response.status === 401 || response.status === 403) {
        signOut();
        return;
      }
      if (!response.ok) throw new Error("resolution update failed");
      const result = await response.json() as { resolved: boolean; resolvedAt: string | null };
      setData((current) => {
        if (!current) return current;
        const insights = current.insights.map((insight) => insight.id === item.id
          ? { ...insight, resolved: result.resolved, resolvedAt: result.resolvedAt }
          : insight);
        const priorityCounts = unresolvedPriorityCounts(insights);
        const unresolved = insights.filter((insight) => !insight.resolved).length;
        return {
          ...current,
          stats: {
            ...current.stats,
            unresolved,
            resolved: insights.length - unresolved,
            urgent: priorityCounts.urgent,
            needsAction: priorityCounts.urgent + priorityCounts.high,
            priorityCounts,
          },
          insights,
        };
      });
    } catch {
      setResolutionError("状态保存失败，请稍后重试。反馈原状态没有改变。");
    } finally {
      setUpdatingIds((current) => current.filter((id) => id !== item.id));
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const header = ["反馈编号", "修复状态", "修复时间", "优先级", "优先分", "核心结论", "建议动作", "反馈类型", "发生位置", "影响", "NPS", "提交时间"];
    const rows = data.insights.map((item) => [item.id, item.resolved ? "已修复" : "未修复", item.resolvedAt, priorityLabels[item.priority], item.priorityScore, item.headline, item.recommendedAction, item.feedbackType, item.issueStage, item.impact, item.nps, item.createdAt]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `kinabot-feedback-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyDigest = async () => {
    if (!data) return;
    const topActions = data.insights.filter((item) => !item.resolved && item.priority !== "observe").slice(0, 5);
    const digest = [
      `KinaBot 反馈洞察 · ${new Date(data.generatedAt).toLocaleDateString("zh-CN")}`,
      `累计反馈：${data.stats.total}｜未修复：${data.stats.unresolved}｜已修复：${data.stats.resolved}｜立即复核：${data.stats.urgent}｜平均 NPS：${data.stats.averageNps ?? "—"}`,
      "",
      `高频主题：${data.signals.themes.slice(0, 5).map((item) => `${item.name}（${item.count}）`).join("、") || "暂无"}`,
      "",
      "建议优先查看：",
      ...(topActions.length > 0 ? topActions.map((item, index) => `${index + 1}. [${priorityLabels[item.priority]}] ${item.headline} — ${item.recommendedAction}`) : ["暂无需要优先处理的反馈。"]),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(digest);
      setCopyState("已复制");
      window.setTimeout(() => setCopyState("复制洞察摘要"), 1800);
    } catch {
      setCopyState("复制失败");
    }
  };

  if (loading) {
    return <main className="admin-loading"><span className="admin-pulse" /><p>正在汇总反馈信号…</p></main>;
  }

  if (error === "password") {
    return (
      <main className="admin-access-page">
        <section>
          <p className="eyebrow">Maintainer access</p>
          <h1>进入反馈雷达</h1>
          <p>这里包含用户反馈的提炼结果，仅供维护者查看。请输入维护密码继续。</p>
          <form className="admin-login-form" autoComplete="off" onSubmit={submitPassword}>
            <label htmlFor="adminPassword">维护密码</label>
            <input
              id="adminPassword"
              name="kinabot-maintainer-one-time-passcode"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              required
            />
            {passwordError && <span className="admin-login-error" role="alert">{passwordError}</span>}
            <button className="button button-primary" type="submit" disabled={signingIn}>
              {signingIn ? "正在验证…" : "进入反馈雷达"}
            </button>
          </form>
          {/* Use a native navigation here so the published Worker always performs a full route change. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="admin-back-link" href="/">← 返回反馈表单</a>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-access-page">
        <section>
          <p className="eyebrow">Maintainer access</p>
          <h1>暂时无法读取反馈</h1>
          <p>反馈数据库可能暂时不可用，请稍后重试。</p>
          <button className="button button-secondary" type="button" onClick={() => { setLoading(true); void loadDashboard(sessionToken); }}>重新尝试</button>
        </section>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link className="brand" href="/admin"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Kina</span></Link>
        <div className="admin-header-meta">
          <span><i /> 每 30 秒自动更新</span>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">返回反馈表单 ↗</a>
          <button type="button" onClick={signOut}>退出维护模式</button>
        </div>
      </header>

      <section className="admin-hero">
        <div><p className="eyebrow">Feedback intelligence</p><h1>反馈雷达</h1><p>每一份反馈都会被转成可累积的产品信号：先看什么、为什么重要、下一步做什么。</p></div>
        <div className="admin-hero-actions"><button type="button" onClick={copyDigest}>{copyState}</button><button type="button" onClick={exportCsv}>导出摘要 CSV</button><button className="refresh-button" type="button" onClick={() => void loadDashboard(sessionToken)} aria-label="立即刷新">↻</button></div>
      </section>

      <section className="admin-stat-grid" aria-label="累计反馈摘要">
        <article><span>累计反馈</span><strong>{data.stats.total}</strong><small>每一份都进入累计洞察</small></article>
        <article className={data.stats.needsAction > 0 ? "has-alert" : ""}><span>需要优先处理</span><strong>{data.stats.needsAction}</strong><small>高优先级与立即复核</small></article>
        <article><span>平均推荐分</span><strong>{data.stats.averageNps ?? "—"}</strong><small>满分 10 分</small></article>
        <article><span>分析结果反馈</span><strong>{data.stats.analysisFeedback}</strong><small>涉及指标或结果可信度</small></article>
        <article><span>隐私信号</span><strong>{data.stats.privacySignals}</strong><small>需要留意边界说明</small></article>
      </section>

      <section className="admin-signals-grid">
        <SignalList title="反馈类型" subtitle="用户最常反馈什么" items={data.signals.feedbackTypes} />
        <SignalList title="高摩擦步骤" subtitle="问题最常发生在哪里" items={data.signals.issueStages} />
        <SignalList title="继续使用的关键" subtitle="最值得投入的改进方向" items={data.signals.requestedImprovements} />
      </section>

      <section className="admin-main-grid">
        <div className="insight-feed">
          <div className="feed-heading">
            <div><p className="eyebrow">Action queue</p><h2>{filter === "resolved" ? "已修复" : "最值得先看的反馈"}</h2></div>
            <div className="filter-row">
              {(["all", "urgent", "high", "medium", "observe", "resolved"] as const).map((item) => (
                <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>
                  {item === "all" ? "全部" : item === "resolved" ? "已修复" : priorityLabels[item]}
                  <span>{item === "all" ? data.stats.unresolved : item === "resolved" ? data.stats.resolved : data.stats.priorityCounts[item]}</span>
                </button>
              ))}
            </div>
          </div>

          {resolutionError && <p className="resolution-error" role="alert">{resolutionError}</p>}
          {visibleInsights.length === 0 ? <div className="admin-empty"><strong>{filter === "resolved" ? "暂时没有已修复的反馈" : "这个分类暂时没有反馈"}</strong><span>{filter === "resolved" ? "点击反馈上的“未修复”按钮后，它会进入这里。" : "新的提交会在 30 秒内自动出现。"}</span></div> : visibleInsights.map((item) => (
            <article className={`insight-card priority-${item.priority}${item.resolved ? " is-resolved" : ""}`} key={item.id}>
              <div className="insight-topline">
                <div className="insight-state-line">
                  <span className="priority-pill">{priorityLabels[item.priority]} · {item.priorityScore}</span>
                  <button
                    className={`resolution-toggle${item.resolved ? " is-resolved" : ""}`}
                    type="button"
                    aria-pressed={item.resolved}
                    title={item.resolved ? "点击恢复为未修复" : "点击标记为已修复"}
                    disabled={updatingIds.includes(item.id)}
                    onClick={() => void toggleResolution(item)}
                  >
                    <span aria-hidden="true">{item.resolved ? "✓" : "○"}</span>
                    {updatingIds.includes(item.id) ? "保存中…" : item.resolved ? "已修复" : "未修复"}
                  </button>
                </div>
                <time>{formatDate(item.createdAt)}</time>
              </div>
              <h3>{item.headline}</h3>
              <p className="insight-essence">{item.essence}</p>
              <div className="recommended-action"><span>建议动作</span><strong>{item.recommendedAction}</strong></div>
              <div className="insight-tags">{item.riskFlags.map((flag) => <span className="risk-tag" key={flag}>{flag}</span>)}{item.themes.slice(0, 4).map((theme) => <span key={theme}>{theme}</span>)}</div>
              <details>
                <summary>查看提炼依据</summary>
                <dl>
                  <div><dt>实际发生</dt><dd>{item.actualEvent || "—"}</dd></div>
                  <div><dt>原本期待</dt><dd>{item.expectedEvent || "—"}</dd></div>
                  <div><dt>完成情况</dt><dd>{item.taskOutcome || "—"}</dd></div>
                  <div><dt>频率 / 影响</dt><dd>{item.frequency || "—"} · {item.impact || "—"}</dd></div>
                  <div><dt>用户优先建议</dt><dd>{item.topImprovement || "—"}</dd></div>
                  <div><dt>推荐分</dt><dd>{item.nps >= 0 ? `${item.nps} / 10` : "—"}</dd></div>
                </dl>
                <span className="feedback-id">{item.id}</span>
              </details>
            </article>
          ))}
        </div>

        <aside className="theme-panel">
          <p className="eyebrow">Compounding signals</p>
          <h2>累计主题</h2>
          <p className="theme-intro">出现次数越多，信号越强。主题会随着每次新反馈自动累积。</p>
          <div className="theme-cloud">
            {data.signals.themes.map((theme, index) => <span key={theme.name} style={{ fontSize: `${Math.max(11, 19 - index)}px` }}>{theme.name}<b>{theme.count}</b></span>)}
          </div>
          <div className="method-note"><strong>隐私友好的结构化提炼</strong><p>核心结论由本地规则根据用户选择和开放文本生成，不会把反馈发送给外部 AI 服务。</p></div>
          <small>最后更新：{formatDate(data.generatedAt)}</small>
        </aside>
      </section>
    </main>
  );
}
