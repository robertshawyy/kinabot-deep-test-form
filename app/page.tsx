"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const steps = [
  { number: "01", short: "反馈定位", title: "这次反馈主要关于什么？" },
  { number: "02", short: "问题描述", title: "帮助我们还原问题现场" },
  { number: "03", short: "分析专项", title: "核对分析结果与录音条件" },
  { number: "04", short: "理解价值", title: "结果是否容易理解、有所帮助？" },
  { number: "05", short: "隐私安全", title: "隐私边界和技术信息" },
  { number: "06", short: "改进提交", title: "告诉我们最该先改什么" },
];

const feedbackTypes = [
  "无法完成某项操作",
  "分析结果可能不准确",
  "分析结果难以理解",
  "页面或操作流程不好使用",
  "速度或稳定性问题",
  "隐私或数据安全顾虑",
  "多语言体验问题",
  "无障碍使用问题",
  "功能建议",
  "正面反馈",
  "其他",
];

const attemptedTaskOptions = [
  "登录账户",
  "完善账户资料",
  "直接录音",
  "上传已有录音",
  "完成语音分析",
  "理解八项指标",
  "查看历史趋势",
  "查看健康习惯建议",
  "保存健康习惯",
  "管理账户或数据",
  "其他",
];

const issueStageOptions = [
  "验证码登录",
  "账户资料",
  "隐私同意",
  "直接录音",
  "文件上传",
  "语音转写",
  "特征评分",
  "分析结果页面",
  "历史趋势页面",
  "健康习惯",
  "不确定",
  "其他",
];

const metricOptions = [
  "词汇多样性",
  "表达长度",
  "句子结构",
  "语速",
  "停顿模式",
  "重复模式",
  "情绪表达",
  "转写清晰度",
  "核心总结或行动建议",
  "不确定",
];

const metricIssueOptions = [
  "与录音中的实际情况明显不一致",
  "不理解分数是如何计算的",
  "多次相似录音的结果变化太大",
  "不同录音的结果几乎没有变化",
  "分数过于极端",
  "结果看起来固定不变",
  "容易被误解为健康或认知判断",
  "其他",
];

const privacyConcernOptions = [
  "不清楚原始音频是否被保存",
  "不清楚完整转写是否被保存",
  "不清楚数据会保留多久",
  "不清楚如何删除账户或数据",
  "担心数据被第三方访问",
  "担心家人或其他人过度解读分数",
  "担心结果被当作医疗或认知诊断",
  "发现可能的隐私或安全问题",
  "没有这方面的顾虑",
  "其他",
];

type FormData = {
  feedbackType: string;
  feedbackTypeOther: string;
  attemptedTasks: string[];
  attemptedTaskOther: string;
  issueStage: string;
  issueStageOther: string;
  taskOutcome: string;
  actualEvent: string;
  expectedEvent: string;
  frequency: string;
  impact: string;
  troubleshooting: string[];
  troubleshootingOther: string;
  analysisRelated: string;
  affectedMetrics: string[];
  metricIssueTypes: string[];
  metricIssueOther: string;
  recordingMethod: string;
  recordingLanguage: string;
  recordingDuration: string;
  recordingEnvironment: string;
  obviousPauses: string;
  multipleSpeakers: string;
  speakingStyle: string;
  transcriptionAccuracy: string;
  surprisingResult: string;
  metricsUnderstanding: string;
  scoreDirectionUnderstanding: string;
  transcriptPreviewPreference: string;
  calculationBasisPreference: string;
  selfUnderstandingValue: string;
  wellnessAdviceValue: string;
  privacyConcerns: string[];
  privacyConcernOther: string;
  boundaryNonMedical: string;
  boundarySampleOnly: string;
  boundaryNoMedicalDecision: string;
  privacyDetail: string;
  screenshotWillingness: string;
  anonymousTechConsent: string;
  appVersion: string;
  scoringVersion: string;
  topImprovement: string;
  retentionPriority: string;
  retentionPriorityOther: string;
  usageFrequency: string;
  nps: number;
  followUpPreference: string;
  otherFeedback: string;
  sensitiveInfoConfirmation: boolean;
  nonMedicalConfirmation: boolean;
  website: string;
  startedAt: number;
  technicalContext?: {
    browser: string;
    locale: string;
    timezone: string;
    viewport: string;
  };
};

const createInitialData = (): FormData => ({
  feedbackType: "",
  feedbackTypeOther: "",
  attemptedTasks: [],
  attemptedTaskOther: "",
  issueStage: "",
  issueStageOther: "",
  taskOutcome: "",
  actualEvent: "",
  expectedEvent: "",
  frequency: "",
  impact: "",
  troubleshooting: [],
  troubleshootingOther: "",
  analysisRelated: "",
  affectedMetrics: [],
  metricIssueTypes: [],
  metricIssueOther: "",
  recordingMethod: "",
  recordingLanguage: "",
  recordingDuration: "",
  recordingEnvironment: "",
  obviousPauses: "",
  multipleSpeakers: "",
  speakingStyle: "",
  transcriptionAccuracy: "",
  surprisingResult: "",
  metricsUnderstanding: "",
  scoreDirectionUnderstanding: "",
  transcriptPreviewPreference: "",
  calculationBasisPreference: "",
  selfUnderstandingValue: "",
  wellnessAdviceValue: "",
  privacyConcerns: [],
  privacyConcernOther: "",
  boundaryNonMedical: "",
  boundarySampleOnly: "",
  boundaryNoMedicalDecision: "",
  privacyDetail: "",
  screenshotWillingness: "",
  anonymousTechConsent: "",
  appVersion: "",
  scoringVersion: "",
  topImprovement: "",
  retentionPriority: "",
  retentionPriorityOther: "",
  usageFrequency: "",
  nps: -1,
  followUpPreference: "",
  otherFeedback: "",
  sensitiveInfoConfirmation: false,
  nonMedicalConfirmation: false,
  website: "",
  startedAt: Date.now(),
});

function FieldError({ message }: { message?: string }) {
  return message ? <p className="field-error" role="alert">{message}</p> : null;
}

function OptionGrid({
  id,
  options,
  value,
  onChange,
  multiple = false,
  compact = false,
}: {
  id: string;
  options: string[];
  value: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`option-grid${compact ? " is-compact" : ""}`}>
      {options.map((option, index) => {
        const selected = multiple ? safeList(value).includes(option) : value === option;
        return (
          <label key={option} className={`option-tile${selected ? " is-selected" : ""}`} htmlFor={`${id}-${index}`}>
            <input
              id={`${id}-${index}`}
              type={multiple ? "checkbox" : "radio"}
              name={multiple ? undefined : id}
              checked={selected}
              onChange={() => onChange(option)}
            />
            <span className={multiple ? "check-box" : "choice-indicator"} aria-hidden="true">{multiple ? "✓" : ""}</span>
            <strong>{option}</strong>
          </label>
        );
      })}
    </div>
  );
}

function RatingScale({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="nps-scale" role="radiogroup" aria-label="0 到 10 分推荐意愿">
        {Array.from({ length: 11 }, (_, index) => index).map((number) => (
          <label key={number} className={value === number ? "is-selected" : ""}>
            <input type="radio" name="nps" checked={value === number} onChange={() => onChange(number)} />
            <span>{number}</span>
          </label>
        ))}
      </div>
      <div className="rating-labels"><span>完全不愿意</span><span>非常愿意</span></div>
    </div>
  );
}

function CharacterCount({ value, max }: { value: string; max: number }) {
  return <span className="character-count" aria-live="polite">{value.length} / {max}</span>;
}

function safeList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function contains(value: unknown, option: string) {
  return safeList(value).includes(option);
}

export default function Home() {
  return <DeepFeedbackForm />;
}

function DeepFeedbackForm() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [data, setData] = useState<FormData>(createInitialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [receiptId, setReceiptId] = useState("");
  const submissionTokenRef = useRef("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem("kina-deep-feedback-draft-v2");
        if (saved) setData({ ...createInitialData(), ...JSON.parse(saved) });
      } catch {
        // Local drafts are optional and never block the form.
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady || submitState === "success") return;
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem("kina-deep-feedback-draft-v2", JSON.stringify(data));
      } catch {
        // Local drafts are optional and never block the form.
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [data, draftReady, submitState]);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    submissionTokenRef.current = "";
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggle = (key: "attemptedTasks" | "troubleshooting" | "affectedMetrics" | "metricIssueTypes" | "privacyConcerns", option: string, exclusive?: string) => {
    const current = safeList(data[key]);
    let next: string[];
    if (current.includes(option)) {
      next = current.filter((item) => item !== option);
    } else if (exclusive && option === exclusive) {
      next = [option];
    } else {
      next = [...current.filter((item) => item !== exclusive), option];
    }
    update(key, next);
  };

  const validateStep = (stepIndex: number) => {
    const nextErrors: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!data.feedbackType) nextErrors.feedbackType = "请选择最主要的反馈类型。";
      if (data.feedbackType === "其他" && !data.feedbackTypeOther.trim()) nextErrors.feedbackTypeOther = "请补充反馈类型。";
      if (safeList(data.attemptedTasks).length === 0) nextErrors.attemptedTasks = "请至少选择一项当时想完成的任务。";
      if (contains(data.attemptedTasks, "其他") && !data.attemptedTaskOther.trim()) nextErrors.attemptedTaskOther = "请补充任务内容。";
      if (!data.issueStage) nextErrors.issueStage = "请选择问题发生的位置。";
      if (data.issueStage === "其他" && !data.issueStageOther.trim()) nextErrors.issueStageOther = "请补充问题发生的位置。";
    }
    if (stepIndex === 1) {
      if (!data.taskOutcome) nextErrors.taskOutcome = "请选择任务的最终结果。";
      if (!data.actualEvent.trim()) nextErrors.actualEvent = "请描述实际发生了什么。";
      if (!data.expectedEvent.trim()) nextErrors.expectedEvent = "请说明你原本期待发生什么。";
      if (!data.frequency) nextErrors.frequency = "请选择问题出现的频率。";
      if (!data.impact) nextErrors.impact = "请选择问题造成的影响。";
      if (safeList(data.troubleshooting).length === 0) nextErrors.troubleshooting = "请选择至少一项尝试情况。";
      if (contains(data.troubleshooting, "其他") && !data.troubleshootingOther.trim()) nextErrors.troubleshootingOther = "请补充你的尝试。";
    }
    if (stepIndex === 2) {
      if (!data.analysisRelated) nextErrors.analysisRelated = "请选择这次反馈是否与分析结果有关。";
      if (data.analysisRelated === "yes") {
        if (safeList(data.affectedMetrics).length === 0) nextErrors.affectedMetrics = "请至少选择一项相关指标。";
        if (safeList(data.metricIssueTypes).length === 0) nextErrors.metricIssueTypes = "请至少选择一种问题表现。";
        if (contains(data.metricIssueTypes, "其他") && !data.metricIssueOther.trim()) nextErrors.metricIssueOther = "请补充问题表现。";
        if (!data.recordingMethod) nextErrors.recordingMethod = "请选择录音方式。";
        if (!data.recordingLanguage) nextErrors.recordingLanguage = "请选择录音语言。";
        if (!data.recordingDuration) nextErrors.recordingDuration = "请选择录音长度。";
        if (!data.recordingEnvironment) nextErrors.recordingEnvironment = "请选择录音环境。";
        if (!data.obviousPauses) nextErrors.obviousPauses = "请选择是否存在明显停顿。";
        if (!data.multipleSpeakers) nextErrors.multipleSpeakers = "请选择是否有多人说话。";
        if (!data.speakingStyle) nextErrors.speakingStyle = "请选择说话方式。";
        if (!data.transcriptionAccuracy) nextErrors.transcriptionAccuracy = "请选择系统是否正确听懂语音。";
      }
    }
    if (stepIndex === 3) {
      const required = [
        ["metricsUnderstanding", data.metricsUnderstanding],
        ["scoreDirectionUnderstanding", data.scoreDirectionUnderstanding],
        ["transcriptPreviewPreference", data.transcriptPreviewPreference],
        ["calculationBasisPreference", data.calculationBasisPreference],
        ["selfUnderstandingValue", data.selfUnderstandingValue],
        ["wellnessAdviceValue", data.wellnessAdviceValue],
      ];
      required.forEach(([key, value]) => { if (!value) nextErrors[key] = "请选择一项。"; });
    }
    if (stepIndex === 4) {
      if (safeList(data.privacyConcerns).length === 0) nextErrors.privacyConcerns = "请至少选择一项；如无顾虑，可选择“没有这方面的顾虑”。";
      if (contains(data.privacyConcerns, "其他") && !data.privacyConcernOther.trim()) nextErrors.privacyConcernOther = "请补充你的顾虑。";
      if (!data.boundaryNonMedical) nextErrors.boundaryNonMedical = "请选择你对这一边界的理解。";
      if (!data.boundarySampleOnly) nextErrors.boundarySampleOnly = "请选择你对这一边界的理解。";
      if (!data.boundaryNoMedicalDecision) nextErrors.boundaryNoMedicalDecision = "请选择你对这一边界的理解。";
      if (!data.screenshotWillingness) nextErrors.screenshotWillingness = "请选择是否愿意提供脱敏截图。";
      if (!data.anonymousTechConsent) nextErrors.anonymousTechConsent = "请选择是否同意附加匿名技术信息。";
    }
    if (stepIndex === 5) {
      if (!data.topImprovement.trim()) nextErrors.topImprovement = "请填写最希望优先改进的一件事。";
      if (!data.retentionPriority) nextErrors.retentionPriority = "请选择最可能让你继续使用的一项改进。";
      if (data.retentionPriority === "其他" && !data.retentionPriorityOther.trim()) nextErrors.retentionPriorityOther = "请补充改进内容。";
      if (!data.usageFrequency) nextErrors.usageFrequency = "请选择你愿意使用的频率。";
      if (data.nps < 0) nextErrors.nps = "请选择推荐意愿。";
      if (!data.followUpPreference) nextErrors.followUpPreference = "请选择后续参与意愿。";
      if (!data.sensitiveInfoConfirmation) nextErrors.sensitiveInfoConfirmation = "请确认反馈中不包含敏感信息。";
      if (!data.nonMedicalConfirmation) nextErrors.nonMedicalConfirmation = "请确认你理解不会获得医疗建议或诊断。";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => document.getElementById(Object.keys(nextErrors)[0])?.focus(), 0);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    setMaxStep((current) => Math.max(current, nextStep));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((current) => Math.max(0, current - 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep(5)) return;
    setSubmitState("submitting");

    const submissionToken = submissionTokenRef.current || crypto.randomUUID();
    submissionTokenRef.current = submissionToken;
    const submission: FormData & { submissionToken: string } = { ...data, submissionToken };
    if (data.anonymousTechConsent === "yes") {
      submission.technicalContext = {
        browser: navigator.userAgent.slice(0, 300),
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
    } else {
      delete submission.technicalContext;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("submission failed");
      const result = (await response.json()) as { id: string };
      setReceiptId(result.id);
      setSubmitState("success");
      submissionTokenRef.current = "";
      window.sessionStorage.removeItem("kina-deep-feedback-draft-v2");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitState("error");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const resetForm = () => {
    setData(createInitialData());
    setStep(0);
    setMaxStep(0);
    setErrors({});
    setReceiptId("");
    setSubmitState("idle");
    submissionTokenRef.current = "";
  };

  if (submitState === "success") {
    return (
      <main className="success-page">
        <section className="success-card" aria-labelledby="success-title">
          <div className="success-mark" aria-hidden="true">✓</div>
          <p className="eyebrow">匿名反馈已安全送达</p>
          <h1 id="success-title">谢谢你帮助 KinaBot 变得更清楚、更可信。</h1>
          <p className="success-copy">维护团队会根据问题影响、可复现程度和安全风险分类处理。此反馈不会用于医疗判断。</p>
          <div className="receipt"><span>反馈编号</span><strong>{receiptId}</strong></div>
          <p className="success-note">建议保存此编号，以便后续引用。</p>
          <button className="button button-secondary" type="button" onClick={resetForm}>提交另一份反馈</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Kina 深度用户反馈首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Kina</span>
        </a>
        <span className="program-label">深度用户反馈 · Private beta</span>
        <span className="draft-status"><i aria-hidden="true" /> 草稿仅保存在本次浏览</span>
      </header>

      <div className="form-layout" id="top">
        <aside className="intro-panel">
          <div>
            <p className="eyebrow">KinaBot deep feedback</p>
            <h1>把真实问题，说清楚就好。</h1>
            <p className="intro-copy">这是一份约 5–8 分钟的匿名反馈。请描述发生了什么、造成了什么影响，以及你最希望我们先改进什么。</p>
          </div>

          <nav className="step-nav" aria-label="表单步骤">
            {steps.map((item, index) => (
              <button
                key={item.number}
                type="button"
                className={`${index === step ? "is-current" : ""}${index < step ? " is-complete" : ""}`}
                onClick={() => {
                  if (index <= maxStep) {
                    setStep(index);
                    setErrors({});
                  }
                }}
                disabled={index > maxStep}
                aria-current={index === step ? "step" : undefined}
              >
                <span>{index < step ? "✓" : item.number}</span>
                <strong>{item.short}</strong>
              </button>
            ))}
          </nav>

          <div className="privacy-note">
            <span aria-hidden="true">◎</span>
            <p><strong>请不要填写身份或医疗信息</strong>不要提交姓名、邮箱、验证码、完整转写、原始录音、病历或诊断。</p>
          </div>
        </aside>

        <section className="form-card" aria-labelledby="form-title">
          <div className="form-progress" aria-label={`完成进度 ${Math.round(progress)}%`}><span style={{ width: `${progress}%` }} /></div>
          <div className="form-card-inner">
            <div className="step-heading">
              <div><p>第 {step + 1} 步 / 共 {steps.length} 步</p><h2 id="form-title">{steps[step].title}</h2></div>
              <span className="time-chip">约 {step === 1 || step === 2 ? "2" : "1"} 分钟</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {step === 0 && (
                <div className="step-content">
                  <div className="privacy-banner"><strong>填写前请先脱敏</strong><span>截图请遮盖身份信息；不要粘贴完整转写，也不要上传原始录音。</span></div>
                  <fieldset className="field-group" id="feedbackType" tabIndex={-1}>
                    <legend>这次反馈最主要关于什么？ <em>必填，单选</em></legend>
                    <OptionGrid id="feedbackTypeOption" options={feedbackTypes} value={data.feedbackType} onChange={(value) => update("feedbackType", value)} />
                    <FieldError message={errors.feedbackType} />
                  </fieldset>
                  {data.feedbackType === "其他" && (
                    <div className="field-group"><label htmlFor="feedbackTypeOther">请补充反馈类型 <em>必填</em></label><input id="feedbackTypeOther" className="text-input" value={data.feedbackTypeOther} onChange={(event) => update("feedbackTypeOther", event.target.value)} maxLength={100} /><FieldError message={errors.feedbackTypeOther} /></div>
                  )}
                  <fieldset className="field-group" id="attemptedTasks" tabIndex={-1}>
                    <legend>你当时想完成什么？ <em>必填，可多选</em></legend>
                    <OptionGrid id="attemptedTask" options={attemptedTaskOptions} value={data.attemptedTasks} multiple onChange={(value) => toggle("attemptedTasks", value)} />
                    <FieldError message={errors.attemptedTasks} />
                  </fieldset>
                  {contains(data.attemptedTasks, "其他") && (
                    <div className="field-group"><label htmlFor="attemptedTaskOther">请补充任务内容 <em>必填</em></label><input id="attemptedTaskOther" className="text-input" value={data.attemptedTaskOther} onChange={(event) => update("attemptedTaskOther", event.target.value)} maxLength={120} /><FieldError message={errors.attemptedTaskOther} /></div>
                  )}
                  <fieldset className="field-group" id="issueStage" tabIndex={-1}>
                    <legend>问题发生在哪一步？ <em>必填，单选</em></legend>
                    <OptionGrid id="issueStageOption" options={issueStageOptions} value={data.issueStage} onChange={(value) => update("issueStage", value)} compact />
                    <FieldError message={errors.issueStage} />
                  </fieldset>
                  {data.issueStage === "其他" && (
                    <div className="field-group"><label htmlFor="issueStageOther">请补充发生位置 <em>必填</em></label><input id="issueStageOther" className="text-input" value={data.issueStageOther} onChange={(event) => update("issueStageOther", event.target.value)} maxLength={120} /><FieldError message={errors.issueStageOther} /></div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="step-content">
                  <fieldset className="field-group" id="taskOutcome" tabIndex={-1}>
                    <legend>最终是否完成了任务？ <em>必填</em></legend>
                    <OptionGrid id="taskOutcomeOption" options={["完成，没有困难", "完成，但需要重试或绕过问题", "只完成了一部分", "完全无法完成"]} value={data.taskOutcome} onChange={(value) => update("taskOutcome", value)} />
                    <FieldError message={errors.taskOutcome} />
                  </fieldset>
                  <div className="field-group">
                    <label htmlFor="actualEvent">实际发生了什么？ <em>必填</em></label>
                    <p className="field-help">请写出你看到的现象和操作顺序，不要提供身份、医疗或完整语音内容。</p>
                    <textarea id="actualEvent" value={data.actualEvent} onChange={(event) => update("actualEvent", event.target.value)} maxLength={500} rows={5} placeholder="例如：点击“开始分析”后等待两分钟，页面回到上传步骤，没有显示错误代码……" aria-invalid={Boolean(errors.actualEvent)} />
                    <CharacterCount value={data.actualEvent} max={500} /><FieldError message={errors.actualEvent} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="expectedEvent">你原本期待发生什么？ <em>必填</em></label>
                    <textarea id="expectedEvent" value={data.expectedEvent} onChange={(event) => update("expectedEvent", event.target.value)} maxLength={300} rows={4} placeholder="例如：分析完成后进入结果页面，并说明八项指标……" aria-invalid={Boolean(errors.expectedEvent)} />
                    <CharacterCount value={data.expectedEvent} max={300} /><FieldError message={errors.expectedEvent} />
                  </div>
                  <div className="field-row">
                    <div className="field-group"><label htmlFor="frequency">问题出现的频率 <em>必填</em></label><select id="frequency" value={data.frequency} onChange={(event) => update("frequency", event.target.value)} aria-invalid={Boolean(errors.frequency)}><option value="">请选择</option>{["每次都会出现", "经常出现", "偶尔出现", "只出现一次", "不确定"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.frequency} /></div>
                    <div className="field-group"><label htmlFor="impact">问题造成的影响 <em>必填</em></label><select id="impact" value={data.impact} onChange={(event) => update("impact", event.target.value)} aria-invalid={Boolean(errors.impact)}><option value="">请选择</option>{["无法继续使用", "严重影响我对结果的信任", "可以绕过，但明显影响体验", "造成轻微困扰", "没有功能影响，只是改进建议"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.impact} /></div>
                  </div>
                  <fieldset className="field-group" id="troubleshooting" tabIndex={-1}>
                    <legend>你是否尝试过解决问题？ <em>必填，可多选</em></legend>
                    <OptionGrid id="troubleshootingOption" options={["重新操作后恢复正常", "更换录音或文件后恢复正常", "刷新页面后恢复正常", "更换设备或浏览器后恢复正常", "尝试过，但问题仍然存在", "没有尝试", "其他"]} value={data.troubleshooting} multiple onChange={(value) => toggle("troubleshooting", value, "没有尝试")} />
                    <FieldError message={errors.troubleshooting} />
                  </fieldset>
                  {contains(data.troubleshooting, "其他") && <div className="field-group"><label htmlFor="troubleshootingOther">请补充你的尝试 <em>必填</em></label><input id="troubleshootingOther" className="text-input" value={data.troubleshootingOther} onChange={(event) => update("troubleshootingOther", event.target.value)} maxLength={160} /><FieldError message={errors.troubleshootingOther} /></div>}
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <fieldset className="field-group" id="analysisRelated" tabIndex={-1}>
                    <legend>这次反馈与分析结果有关吗？ <em>必填</em></legend>
                    <OptionGrid id="analysisRelatedOption" options={["有关，需要填写本节", "无关，跳过本节", "不确定"]} value={data.analysisRelated === "yes" ? "有关，需要填写本节" : data.analysisRelated === "no" ? "无关，跳过本节" : data.analysisRelated === "unsure" ? "不确定" : ""} onChange={(value) => update("analysisRelated", value === "有关，需要填写本节" ? "yes" : value === "无关，跳过本节" ? "no" : "unsure")} />
                    <FieldError message={errors.analysisRelated} />
                  </fieldset>
                  {data.analysisRelated && data.analysisRelated !== "yes" && <div className="skip-card"><span aria-hidden="true">→</span><div><strong>本节其余问题已跳过</strong><p>你可以直接继续。关于操作流程、速度或隐私的反馈同样重要。</p></div></div>}
                  {data.analysisRelated === "yes" && (
                    <>
                      <fieldset className="field-group" id="affectedMetrics" tabIndex={-1}><legend>哪些指标存在问题？ <em>必填，可多选</em></legend><OptionGrid id="affectedMetric" options={metricOptions} value={data.affectedMetrics} multiple onChange={(value) => toggle("affectedMetrics", value, "不确定")} /><FieldError message={errors.affectedMetrics} /></fieldset>
                      <fieldset className="field-group" id="metricIssueTypes" tabIndex={-1}><legend>你认为指标存在什么问题？ <em>必填，可多选</em></legend><OptionGrid id="metricIssueType" options={metricIssueOptions} value={data.metricIssueTypes} multiple onChange={(value) => toggle("metricIssueTypes", value)} /><FieldError message={errors.metricIssueTypes} /></fieldset>
                      {contains(data.metricIssueTypes, "其他") && <div className="field-group"><label htmlFor="metricIssueOther">请补充问题表现 <em>必填</em></label><input id="metricIssueOther" className="text-input" value={data.metricIssueOther} onChange={(event) => update("metricIssueOther", event.target.value)} maxLength={160} /><FieldError message={errors.metricIssueOther} /></div>}
                      <div className="section-divider"><span>本次录音的基本条件</span></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="recordingMethod">录音方式 <em>必填</em></label><select id="recordingMethod" value={data.recordingMethod} onChange={(event) => update("recordingMethod", event.target.value)}><option value="">请选择</option><option>在 KinaBot 中直接录音</option><option>上传已有文件</option></select><FieldError message={errors.recordingMethod} /></div><div className="field-group"><label htmlFor="recordingLanguage">录音语言 <em>必填</em></label><select id="recordingLanguage" value={data.recordingLanguage} onChange={(event) => update("recordingLanguage", event.target.value)}><option value="">请选择</option><option>中文</option><option>英文</option><option>日文</option><option>混合语言</option></select><FieldError message={errors.recordingLanguage} /></div></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="recordingDuration">录音长度 <em>必填</em></label><select id="recordingDuration" value={data.recordingDuration} onChange={(event) => update("recordingDuration", event.target.value)}><option value="">请选择</option>{["少于 30 秒", "30–60 秒", "60–90 秒", "超过 90 秒", "不确定"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.recordingDuration} /></div><div className="field-group"><label htmlFor="recordingEnvironment">录音环境 <em>必填</em></label><select id="recordingEnvironment" value={data.recordingEnvironment} onChange={(event) => update("recordingEnvironment", event.target.value)}><option value="">请选择</option>{["安静", "有少量背景声", "有明显噪声", "不确定"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.recordingEnvironment} /></div></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="obviousPauses">录音中有明显停顿吗？ <em>必填</em></label><select id="obviousPauses" value={data.obviousPauses} onChange={(event) => update("obviousPauses", event.target.value)}><option value="">请选择</option><option>是</option><option>否</option><option>不确定</option></select><FieldError message={errors.obviousPauses} /></div><div className="field-group"><label htmlFor="multipleSpeakers">录音中有多人说话吗？ <em>必填</em></label><select id="multipleSpeakers" value={data.multipleSpeakers} onChange={(event) => update("multipleSpeakers", event.target.value)}><option value="">请选择</option><option>是</option><option>否</option><option>不确定</option></select><FieldError message={errors.multipleSpeakers} /></div></div>
                      <div className="field-row"><div className="field-group"><label htmlFor="speakingStyle">说话方式 <em>必填</em></label><select id="speakingStyle" value={data.speakingStyle} onChange={(event) => update("speakingStyle", event.target.value)}><option value="">请选择</option><option>自然表达</option><option>阅读准备好的文本</option><option>使用测试音频</option><option>其他</option></select><FieldError message={errors.speakingStyle} /></div><div className="field-group"><label htmlFor="transcriptionAccuracy">系统是否正确听懂语音？ <em>必填</em></label><select id="transcriptionAccuracy" value={data.transcriptionAccuracy} onChange={(event) => update("transcriptionAccuracy", event.target.value)}><option value="">请选择</option>{["基本正确", "有少量错误", "有很多错误", "完全错误", "没有显示转写，无法判断"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.transcriptionAccuracy} /></div></div>
                      <div className="field-group"><label htmlFor="surprisingResult">哪个结果最让你意外或不信任？为什么？ <em>选填</em></label><p className="field-help">请勿粘贴完整转写文本。</p><textarea id="surprisingResult" value={data.surprisingResult} onChange={(event) => update("surprisingResult", event.target.value)} maxLength={300} rows={4} /><CharacterCount value={data.surprisingResult} max={300} /></div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  {[
                    ["metricsUnderstanding", "你能否理解八项指标代表什么？", ["完全能够理解", "大部分能够理解", "只能理解一部分", "基本不能理解"]],
                    ["scoreDirectionUnderstanding", "你是否理解分数高低不代表健康好坏？", ["理解", "不确定", "不理解"]],
                    ["transcriptPreviewPreference", "你是否希望分析后临时查看转写文本？", ["希望，这会帮助我确认系统是否听对", "不需要", "不确定"]],
                    ["calculationBasisPreference", "你是否希望看到每项分数的计算依据？", ["希望看到更具体的计算依据", "当前解释已经足够", "不确定"]],
                    ["selfUnderstandingValue", "本次结果是否帮助你了解自己的表达方式？", ["很有帮助", "有一些帮助", "帮助不大", "没有帮助", "未查看结果"]],
                    ["wellnessAdviceValue", "健康习惯建议是否实用？", ["实用，我愿意尝试", "有一些帮助", "不适用", "容易被误解为医疗建议", "没有帮助", "未查看建议"]],
                  ].map(([key, label, options]) => (
                    <fieldset className="field-group question-block" id={key as string} tabIndex={-1} key={key as string}>
                      <legend>{label as string} <em>必填</em></legend>
                      <OptionGrid id={`${key}Option`} options={options as string[]} value={data[key as keyof FormData] as string} onChange={(value) => update(key as keyof FormData, value as never)} compact />
                      <FieldError message={errors[key as string]} />
                    </fieldset>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="step-content">
                  <fieldset className="field-group" id="privacyConcerns" tabIndex={-1}><legend>你的主要顾虑是什么？ <em>必填，可多选</em></legend><OptionGrid id="privacyConcern" options={privacyConcernOptions} value={data.privacyConcerns} multiple onChange={(value) => toggle("privacyConcerns", value, "没有这方面的顾虑")} /><FieldError message={errors.privacyConcerns} /></fieldset>
                  {contains(data.privacyConcerns, "其他") && <div className="field-group"><label htmlFor="privacyConcernOther">请补充你的顾虑 <em>必填</em></label><input id="privacyConcernOther" className="text-input" value={data.privacyConcernOther} onChange={(event) => update("privacyConcernOther", event.target.value)} maxLength={180} /><FieldError message={errors.privacyConcernOther} /></div>}
                  <div className="section-divider"><span>请分别确认你对结果边界的理解</span></div>
                  {[
                    ["boundaryNonMedical", "KinaBot 不是医疗或认知诊断工具"],
                    ["boundarySampleOnly", "结果只描述本次语音样本"],
                    ["boundaryNoMedicalDecision", "不应仅凭这些分数作出医疗决定"],
                  ].map(([key, label]) => (
                    <fieldset className="field-group boundary-question" id={key} tabIndex={-1} key={key}><legend>{label} <em>必填</em></legend><OptionGrid id={`${key}Option`} options={["理解", "不确定", "不理解"]} value={data[key as keyof FormData] as string} onChange={(value) => update(key as keyof FormData, value as never)} compact /><FieldError message={errors[key]} /></fieldset>
                  ))}
                  <div className="field-group"><label htmlFor="privacyDetail">补充说明隐私或安全顾虑 <em>选填</em></label><div className="security-note"><strong>严重安全问题请使用私密报告渠道</strong><span>不要在此填写漏洞利用步骤、密钥或其他敏感细节。</span></div><textarea id="privacyDetail" value={data.privacyDetail} onChange={(event) => update("privacyDetail", event.target.value)} maxLength={500} rows={4} /><CharacterCount value={data.privacyDetail} max={500} /></div>
                  <fieldset className="field-group" id="screenshotWillingness" tabIndex={-1}><legend>你是否愿意提供不含敏感信息的截图？ <em>必填</em></legend><OptionGrid id="screenshotOption" options={["愿意", "不愿意", "不适用"]} value={data.screenshotWillingness} onChange={(value) => update("screenshotWillingness", value)} compact /><p className="field-help after-options">如选择愿意，维护团队会另行提供私密渠道；本表单不直接上传截图。</p><FieldError message={errors.screenshotWillingness} /></fieldset>
                  <fieldset className="field-group" id="anonymousTechConsent" tabIndex={-1}><legend>是否同意随反馈附加匿名技术信息？ <em>必填</em></legend><OptionGrid id="techConsentOption" options={["同意", "不同意"]} value={data.anonymousTechConsent === "yes" ? "同意" : data.anonymousTechConsent === "no" ? "不同意" : ""} onChange={(value) => update("anonymousTechConsent", value === "同意" ? "yes" : "no")} compact /><p className="field-help after-options">同意时仅附加浏览器、界面语言、时区和窗口尺寸；不包含姓名、邮箱、音频、转写、医疗信息或密钥。</p><FieldError message={errors.anonymousTechConsent} /></fieldset>
                  {data.anonymousTechConsent === "yes" && <div className="field-row technical-panel"><div className="field-group"><label htmlFor="appVersion">App 版本 <em>选填</em></label><input id="appVersion" className="text-input" value={data.appVersion} onChange={(event) => update("appVersion", event.target.value)} maxLength={40} placeholder="例如 v1.1.0" /></div><div className="field-group"><label htmlFor="scoringVersion">评分模型版本 <em>选填</em></label><input id="scoringVersion" className="text-input" value={data.scoringVersion} onChange={(event) => update("scoringVersion", event.target.value)} maxLength={40} placeholder="结果页如有显示" /></div></div>}
                </div>
              )}

              {step === 5 && (
                <div className="step-content">
                  <div className="field-group highlight-field"><label htmlFor="topImprovement">如果只能改进一件事，你最希望改什么？ <em>必填</em></label><textarea id="topImprovement" value={data.topImprovement} onChange={(event) => update("topImprovement", event.target.value)} maxLength={300} rows={4} placeholder="请只写最重要的一项……" aria-invalid={Boolean(errors.topImprovement)} /><CharacterCount value={data.topImprovement} max={300} /><FieldError message={errors.topImprovement} /></div>
                  <fieldset className="field-group" id="retentionPriority" tabIndex={-1}><legend>哪项改进最可能让你继续使用 KinaBot？ <em>必填，单选</em></legend><OptionGrid id="retentionPriorityOption" options={["更准确的分析", "更容易理解的结果", "临时查看并确认转写", "更清楚的分数计算依据", "更简单的登录流程", "更好的趋势解释", "更完善的隐私控制", "更快的分析速度", "更好的多语言体验", "其他"]} value={data.retentionPriority} onChange={(value) => update("retentionPriority", value)} /><FieldError message={errors.retentionPriority} /></fieldset>
                  {data.retentionPriority === "其他" && <div className="field-group"><label htmlFor="retentionPriorityOther">请补充改进内容 <em>必填</em></label><input id="retentionPriorityOther" className="text-input" value={data.retentionPriorityOther} onChange={(event) => update("retentionPriorityOther", event.target.value)} maxLength={160} /><FieldError message={errors.retentionPriorityOther} /></div>}
                  <div className="field-row"><div className="field-group"><label htmlFor="usageFrequency">你愿意多久使用一次？ <em>必填</em></label><select id="usageFrequency" value={data.usageFrequency} onChange={(event) => update("usageFrequency", event.target.value)}><option value="">请选择</option>{["每天", "每周几次", "每周一次", "偶尔", "不会继续使用", "不确定"].map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.usageFrequency} /></div><div className="field-group"><label htmlFor="followUpPreference">后续参与意愿 <em>必填</em></label><select id="followUpPreference" value={data.followUpPreference} onChange={(event) => update("followUpPreference", event.target.value)}><option value="">请选择</option><option>愿意参加后续测试</option><option>只愿意接收问题修复通知</option><option>不愿意被联系</option></select><FieldError message={errors.followUpPreference} /></div></div>
                  <fieldset className="field-group nps-group" id="nps" tabIndex={-1}><legend>你愿意将 KinaBot 推荐给朋友或家人吗？ <em>必填</em></legend><RatingScale value={data.nps} onChange={(value) => update("nps", value)} /><FieldError message={errors.nps} /></fieldset>
                  <div className="field-group"><label htmlFor="otherFeedback">还有什么想告诉维护团队？ <em>选填</em></label><textarea id="otherFeedback" value={data.otherFeedback} onChange={(event) => update("otherFeedback", event.target.value)} maxLength={500} rows={4} /><CharacterCount value={data.otherFeedback} max={500} /></div>
                  <div className="contact-note"><strong>本表单不收集联系方式</strong><span>如需参加后续测试，请通过单独的联系方式表单提交邮箱，不要写在上方文本中。</span></div>
                  <div className="final-consent-wrap">
                    <label className={`simple-check final-consent${data.sensitiveInfoConfirmation ? " is-checked" : ""}`} htmlFor="sensitiveInfoConfirmation"><input id="sensitiveInfoConfirmation" type="checkbox" checked={data.sensitiveInfoConfirmation} onChange={(event) => update("sensitiveInfoConfirmation", event.target.checked)} /><span className="check-box" aria-hidden="true">✓</span><span><strong>我确认反馈中不包含不必要的敏感信息。</strong><small>包括真实姓名、邮箱、验证码、完整转写、原始录音、医疗诊断和密钥。</small></span></label><FieldError message={errors.sensitiveInfoConfirmation} />
                  </div>
                  <div className="final-consent-wrap">
                    <label className={`simple-check final-consent${data.nonMedicalConfirmation ? " is-checked" : ""}`} htmlFor="nonMedicalConfirmation"><input id="nonMedicalConfirmation" type="checkbox" checked={data.nonMedicalConfirmation} onChange={(event) => update("nonMedicalConfirmation", event.target.checked)} /><span className="check-box" aria-hidden="true">✓</span><span><strong>我理解提交反馈不会获得医疗建议或认知诊断。</strong><small>如有健康疑虑，请联系合资格的医疗专业人员。</small></span></label><FieldError message={errors.nonMedicalConfirmation} />
                  </div>
                  <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={(event) => update("website", event.target.value)} /></div>
                  {submitState === "error" && <div className="submit-error" role="alert">提交响应暂时中断，草稿仍在当前标签页。请直接再次提交，系统会自动避免重复保存。</div>}
                </div>
              )}

              <div className="form-actions">
                {step > 0 ? <button className="button button-secondary" type="button" onClick={goBack}>← 上一步</button> : <span />}
                {step < steps.length - 1 ? <button className="button button-primary" type="button" onClick={goNext}>继续 <span>→</span></button> : <button className="button button-primary submit-button" type="submit" disabled={submitState === "submitting"}>{submitState === "submitting" ? "正在安全提交…" : "提交匿名反馈"}</button>}
              </div>
            </form>
          </div>
        </section>
      </div>

      <footer>
        <span>KinaBot · Dignity first, privacy aware</span>
        <a className="maintainer-entry" href="/admin">维护者入口 <span aria-hidden="true">→</span></a>
        <span>匿名反馈 · 非医疗用途</span>
      </footer>
    </main>
  );
}
