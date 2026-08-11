"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const steps = [
  { number: "01", short: "关于你", title: "先了解你的测试环境" },
  { number: "02", short: "知情同意", title: "确认边界与数据使用" },
  { number: "03", short: "任务记录", title: "回顾这次测试过程" },
  { number: "04", short: "深度反馈", title: "告诉我们真正发生了什么" },
  { number: "05", short: "下一步", title: "完成反馈并选择后续联系" },
];

const taskOptions = [
  "完成邮箱与验证码登录",
  "选择测试语言",
  "上传或录制语音样本",
  "完成一次语言特征分析",
  "阅读单次分析结果",
  "查看个人趋势（3 次以上样本）",
  "查看每日健康行动建议",
];

type FormData = {
  participantCode: string;
  testStage: string;
  role: string;
  ageRange: string;
  device: string;
  language: string;
  priorAiUse: string;
  understoodNonMedical: boolean;
  voiceConsent: boolean;
  voluntaryConsent: boolean;
  privacyReview: boolean;
  completedTasks: string[];
  completionTime: string;
  taskEase: number;
  blockerStage: string;
  blockerDetail: string;
  overallRating: number;
  clarityRating: number;
  trustRating: number;
  privacyRating: number;
  expectedResult: string;
  valuable: string;
  confusing: string;
  missing: string;
  improvement: string;
  nps: number;
  futureUse: string;
  interviewInterest: string;
  contactEmail: string;
  contactLanguage: string;
  productUpdates: boolean;
  finalConsent: boolean;
  website: string;
  startedAt: number;
};

const createInitialData = (): FormData => ({
  participantCode: "",
  testStage: "",
  role: "",
  ageRange: "",
  device: "",
  language: "zh",
  priorAiUse: "",
  understoodNonMedical: false,
  voiceConsent: false,
  voluntaryConsent: false,
  privacyReview: false,
  completedTasks: [],
  completionTime: "",
  taskEase: 0,
  blockerStage: "none",
  blockerDetail: "",
  overallRating: 0,
  clarityRating: 0,
  trustRating: 0,
  privacyRating: 0,
  expectedResult: "",
  valuable: "",
  confusing: "",
  missing: "",
  improvement: "",
  nps: -1,
  futureUse: "",
  interviewInterest: "no",
  contactEmail: "",
  contactLanguage: "zh",
  productUpdates: false,
  finalConsent: false,
  website: "",
  startedAt: Date.now(),
});

function ChoiceCard({
  id,
  name,
  value,
  checked,
  label,
  detail,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  label: string;
  detail?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`choice-card${checked ? " is-selected" : ""}`} htmlFor={id}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="choice-indicator" aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </label>
  );
}

function RatingScale({
  id,
  value,
  onChange,
  low = "非常差",
  high = "非常好",
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  low?: string;
  high?: string;
}) {
  return (
    <div className="rating-wrap" id={id}>
      <div className="rating-scale" role="radiogroup" aria-label={`${low}到${high}`}>
        {Array.from({ length: 7 }, (_, index) => index + 1).map((number) => (
          <label key={number} className={value === number ? "is-selected" : ""}>
            <input
              type="radio"
              name={id}
              value={number}
              checked={value === number}
              onChange={() => onChange(number)}
            />
            <span>{number}</span>
          </label>
        ))}
      </div>
      <div className="rating-labels" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="field-error" role="alert">
      {message}
    </p>
  ) : null;
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [data, setData] = useState<FormData>(createInitialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [receiptId, setReceiptId] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("kina-deep-test-draft-v1");
      if (saved) setData({ ...createInitialData(), ...JSON.parse(saved) });
    } catch {
      // A blocked storage API should never prevent form completion.
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || submitState === "success") return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem("kina-deep-test-draft-v1", JSON.stringify(data));
      } catch {
        // Draft saving is a convenience, not a requirement.
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [data, draftReady, submitState]);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validateStep = (stepIndex: number) => {
    const nextErrors: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!data.participantCode.trim()) nextErrors.participantCode = "请输入测试编号。";
      if (!data.testStage) nextErrors.testStage = "请选择当前测试阶段。";
      if (!data.role) nextErrors.role = "请选择你的身份。";
      if (!data.ageRange) nextErrors.ageRange = "请选择年龄范围。";
      if (!data.device) nextErrors.device = "请选择主要测试设备。";
      if (!data.priorAiUse) nextErrors.priorAiUse = "请选择使用 AI 产品的频率。";
    }
    if (stepIndex === 1) {
      if (!data.understoodNonMedical) nextErrors.understoodNonMedical = "需要确认这一产品边界。";
      if (!data.voiceConsent) nextErrors.voiceConsent = "请确认语音样本已经获得适当同意。";
      if (!data.voluntaryConsent) nextErrors.voluntaryConsent = "需要确认参与是自愿的。";
      if (!data.privacyReview) nextErrors.privacyReview = "请确认你已了解本次反馈的数据范围。";
    }
    if (stepIndex === 2) {
      if (data.completedTasks.length === 0) nextErrors.completedTasks = "请至少选择一项已完成任务。";
      if (!data.completionTime) nextErrors.completionTime = "请选择大致用时。";
      if (!data.taskEase) nextErrors.taskEase = "请为任务难易程度评分。";
      if (data.blockerStage !== "none" && !data.blockerDetail.trim()) {
        nextErrors.blockerDetail = "请简单描述遇到的问题。";
      }
    }
    if (stepIndex === 3) {
      if (!data.overallRating) nextErrors.overallRating = "请给出整体评分。";
      if (!data.clarityRating) nextErrors.clarityRating = "请评价结果的易懂程度。";
      if (!data.trustRating) nextErrors.trustRating = "请评价说明是否让你感到可信。";
      if (!data.privacyRating) nextErrors.privacyRating = "请评价隐私边界是否清晰。";
      if (!data.expectedResult) nextErrors.expectedResult = "请选择结果是否符合预期。";
      if (!data.valuable.trim()) nextErrors.valuable = "请告诉我们最有价值的部分。";
      if (!data.improvement.trim()) nextErrors.improvement = "请给出一项最希望优先改进的内容。";
    }
    if (stepIndex === 4) {
      if (data.nps < 0) nextErrors.nps = "请选择推荐意愿。";
      if (!data.futureUse) nextErrors.futureUse = "请选择未来使用意愿。";
      if (data.interviewInterest === "yes" && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
        nextErrors.contactEmail = "请填写可联系的有效邮箱。";
      }
      if (!data.finalConsent) nextErrors.finalConsent = "请确认反馈内容可用于产品改进。";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => {
        const firstKey = Object.keys(nextErrors)[0];
        document.getElementById(firstKey)?.focus();
      }, 0);
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
    if (!validateStep(4)) return;
    setSubmitState("submitting");
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("submission failed");
      const result = (await response.json()) as { id: string };
      setReceiptId(result.id);
      setSubmitState("success");
      window.localStorage.removeItem("kina-deep-test-draft-v1");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitState("error");
    }
  };

  const resetForm = () => {
    setData(createInitialData());
    setStep(0);
    setMaxStep(0);
    setErrors({});
    setReceiptId("");
    setSubmitState("idle");
  };

  if (submitState === "success") {
    return (
      <main className="success-page">
        <section className="success-card" aria-labelledby="success-title">
          <div className="success-mark" aria-hidden="true">✓</div>
          <p className="eyebrow">反馈已安全送达</p>
          <h1 id="success-title">谢谢你认真完成这次深度测试。</h1>
          <p className="success-copy">
            你的反馈会被用于改进 KinaBot 的清晰度、可用性和隐私说明，不会被用于诊断或医疗判断。
          </p>
          <div className="receipt">
            <span>反馈编号</span>
            <strong>{receiptId}</strong>
          </div>
          <p className="success-note">建议保存此编号，以便后续访谈时引用。</p>
          <button className="button button-secondary" type="button" onClick={resetForm}>
            提交另一份反馈
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Kina 深度体验计划首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Kina</span>
        </a>
        <span className="program-label">深度体验计划 · Private beta</span>
        <span className="draft-status"><i aria-hidden="true" /> 草稿自动保存在本设备</span>
      </header>

      <div className="form-layout" id="top">
        <aside className="intro-panel">
          <div>
            <p className="eyebrow">KinaBot research circle</p>
            <h1>帮助我们把每一次倾听，做得更有尊严。</h1>
            <p className="intro-copy">
              这是一份约 8–12 分钟的深度反馈。我们想知道的不只是“好不好用”，而是哪些时刻让你安心、困惑或停了下来。
            </p>
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
            <p><strong>只收集改进产品所需的信息</strong>请勿在开放文本中填写病历、诊断或他人的身份信息。</p>
          </div>
        </aside>

        <section className="form-card" aria-labelledby="form-title">
          <div className="form-progress" aria-label={`完成进度 ${Math.round(progress)}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="form-card-inner">
            <div className="step-heading">
              <div>
                <p>第 {step + 1} 步 / 共 {steps.length} 步</p>
                <h2 id="form-title">{steps[step].title}</h2>
              </div>
              <span className="time-chip">约 {step === 3 ? "4" : "2"} 分钟</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {step === 0 && (
                <div className="step-content">
                  <div className="field-group">
                    <label htmlFor="participantCode">测试编号 <em>必填</em></label>
                    <p className="field-help">请输入邀请邮件中的编号，例如 KINA-024；请不要填写姓名。</p>
                    <input
                      id="participantCode"
                      className="text-input"
                      value={data.participantCode}
                      onChange={(event) => update("participantCode", event.target.value.toUpperCase())}
                      placeholder="KINA-___"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.participantCode)}
                    />
                    <FieldError message={errors.participantCode} />
                  </div>

                  <fieldset className="field-group" id="testStage" tabIndex={-1}>
                    <legend>你目前进行到哪个阶段？ <em>必填</em></legend>
                    <div className="choice-grid two-columns">
                      <ChoiceCard id="stage-first" name="testStage" value="first" checked={data.testStage === "first"} label="首次完整体验" detail="刚完成第一份语音样本" onChange={(value) => update("testStage", value)} />
                      <ChoiceCard id="stage-repeat" name="testStage" value="repeat" checked={data.testStage === "repeat"} label="持续使用体验" detail="已经完成 3 次或以上" onChange={(value) => update("testStage", value)} />
                    </div>
                    <FieldError message={errors.testStage} />
                  </fieldset>

                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="role">你以什么身份体验？ <em>必填</em></label>
                      <select id="role" value={data.role} onChange={(event) => update("role", event.target.value)} aria-invalid={Boolean(errors.role)}>
                        <option value="">请选择</option>
                        <option value="self">为自己体验</option>
                        <option value="family">家人 / 照护者</option>
                        <option value="research">研究人员</option>
                        <option value="care">健康或照护专业人士</option>
                        <option value="other">其他</option>
                      </select>
                      <FieldError message={errors.role} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="ageRange">你的年龄范围 <em>必填</em></label>
                      <select id="ageRange" value={data.ageRange} onChange={(event) => update("ageRange", event.target.value)} aria-invalid={Boolean(errors.ageRange)}>
                        <option value="">请选择</option>
                        <option value="under-40">40 岁以下</option>
                        <option value="40-54">40–54 岁</option>
                        <option value="55-64">55–64 岁</option>
                        <option value="65-74">65–74 岁</option>
                        <option value="75-plus">75 岁或以上</option>
                        <option value="prefer-not">不愿透露</option>
                      </select>
                      <FieldError message={errors.ageRange} />
                    </div>
                  </div>

                  <fieldset className="field-group" id="device" tabIndex={-1}>
                    <legend>主要使用哪种设备测试？ <em>必填</em></legend>
                    <div className="compact-choices">
                      {["iPhone", "Android 手机", "电脑", "平板"].map((item) => (
                        <label key={item} className={data.device === item ? "is-selected" : ""}>
                          <input type="radio" name="device" checked={data.device === item} onChange={() => update("device", item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    <FieldError message={errors.device} />
                  </fieldset>

                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="language">本次测试语言</label>
                      <select id="language" value={data.language} onChange={(event) => update("language", event.target.value)}>
                        <option value="zh">中文</option>
                        <option value="en">English</option>
                        <option value="ja">日本語</option>
                        <option value="mixed">混合使用</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="priorAiUse">你使用 AI 产品的频率 <em>必填</em></label>
                      <select id="priorAiUse" value={data.priorAiUse} onChange={(event) => update("priorAiUse", event.target.value)} aria-invalid={Boolean(errors.priorAiUse)}>
                        <option value="">请选择</option>
                        <option value="never">几乎不用</option>
                        <option value="monthly">每月几次</option>
                        <option value="weekly">每周几次</option>
                        <option value="daily">几乎每天</option>
                      </select>
                      <FieldError message={errors.priorAiUse} />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="step-content">
                  <div className="boundary-card">
                    <span className="boundary-icon" aria-hidden="true">K</span>
                    <div>
                      <strong>KinaBot 帮助你观察语言表达模式</strong>
                      <p>它不是医疗器械，不诊断疾病、不计算疾病风险，也不能替代医生或其他专业人员。</p>
                    </div>
                  </div>
                  <div className="consent-list">
                    {[
                      ["understoodNonMedical", "我理解 KinaBot 提供的是日常反思信息，不是诊断、医学建议或紧急支持。"],
                      ["voiceConsent", "我确认本次上传或录制的语音属于我本人，或已获得其中每位说话者的明确同意。"],
                      ["voluntaryConsent", "我自愿参加本次测试，并知道可以随时退出或跳过非必填问题，不会受到不利影响。"],
                      ["privacyReview", "我理解此表单收集测试反馈；不会要求上传原始音频、完整转写、病历或诊断信息。"],
                    ].map(([key, label], index) => (
                      <div key={key}>
                        <label className={`consent-item${data[key as keyof FormData] ? " is-checked" : ""}`} htmlFor={key}>
                          <input
                            id={key}
                            type="checkbox"
                            checked={Boolean(data[key as keyof FormData])}
                            onChange={(event) => update(key as keyof FormData, event.target.checked as never)}
                          />
                          <span className="check-box" aria-hidden="true">✓</span>
                          <span><b>0{index + 1}</b>{label}</span>
                        </label>
                        <FieldError message={errors[key]} />
                      </div>
                    ))}
                  </div>
                  <div className="info-strip">
                    <strong>如果你现在有健康疑虑</strong>
                    <span>请联系合资格的医疗专业人员；如遇紧急情况，请联系当地紧急服务。</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <fieldset className="field-group" id="completedTasks" tabIndex={-1}>
                    <legend>这次你完成了哪些任务？ <em>可多选，至少一项</em></legend>
                    <div className="task-list">
                      {taskOptions.map((task, index) => {
                        const checked = data.completedTasks.includes(task);
                        return (
                          <label key={task} className={checked ? "is-checked" : ""}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => update("completedTasks", checked ? data.completedTasks.filter((item) => item !== task) : [...data.completedTasks, task])}
                            />
                            <span className="task-number">{String(index + 1).padStart(2, "0")}</span>
                            <span>{task}</span>
                            <span className="check-box" aria-hidden="true">✓</span>
                          </label>
                        );
                      })}
                    </div>
                    <FieldError message={errors.completedTasks} />
                  </fieldset>

                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="completionTime">总共大约用了多久？ <em>必填</em></label>
                      <select id="completionTime" value={data.completionTime} onChange={(event) => update("completionTime", event.target.value)} aria-invalid={Boolean(errors.completionTime)}>
                        <option value="">请选择</option>
                        <option value="under-5">不到 5 分钟</option>
                        <option value="5-10">5–10 分钟</option>
                        <option value="10-20">10–20 分钟</option>
                        <option value="20-plus">超过 20 分钟</option>
                        <option value="incomplete">没有完成</option>
                      </select>
                      <FieldError message={errors.completionTime} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="blockerStage">最明显的问题出现在哪里？</label>
                      <select id="blockerStage" value={data.blockerStage} onChange={(event) => update("blockerStage", event.target.value)}>
                        <option value="none">没有明显问题</option>
                        <option value="login">登录 / 验证码</option>
                        <option value="recording">录音 / 文件选择</option>
                        <option value="analysis">等待分析</option>
                        <option value="results">理解结果</option>
                        <option value="trends">查看趋势</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                  </div>

                  <div className="field-group rating-field">
                    <label id="task-ease-label">完成任务有多容易？ <em>必填</em></label>
                    <RatingScale id="taskEase" value={data.taskEase} onChange={(value) => update("taskEase", value)} low="非常困难" high="非常容易" />
                    <FieldError message={errors.taskEase} />
                  </div>

                  {data.blockerStage !== "none" && (
                    <div className="field-group">
                      <label htmlFor="blockerDetail">发生了什么？ <em>必填</em></label>
                      <textarea id="blockerDetail" value={data.blockerDetail} onChange={(event) => update("blockerDetail", event.target.value)} rows={4} placeholder="请描述你当时看到什么、原本想做什么，以及最后是否完成……" aria-invalid={Boolean(errors.blockerDetail)} />
                      <FieldError message={errors.blockerDetail} />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  <div className="rating-matrix">
                    {[
                      ["overallRating", "整体体验", "很失望", "很满意"],
                      ["clarityRating", "结果易懂程度", "很难懂", "很清楚"],
                      ["trustRating", "说明带来的可信感", "不可信", "很可信"],
                      ["privacyRating", "隐私边界清晰度", "不清晰", "很清晰"],
                    ].map(([key, label, low, high]) => (
                      <div className="matrix-row" key={key}>
                        <div>
                          <label id={`${key}-label`}>{label} <em>必填</em></label>
                          <FieldError message={errors[key]} />
                        </div>
                        <RatingScale id={key} value={data[key as keyof FormData] as number} onChange={(value) => update(key as keyof FormData, value as never)} low={low} high={high} />
                      </div>
                    ))}
                  </div>

                  <fieldset className="field-group" id="expectedResult" tabIndex={-1}>
                    <legend>分析结果与你的预期相比如何？ <em>必填</em></legend>
                    <div className="choice-grid three-columns">
                      {["比预期更有帮助", "大致符合预期", "低于预期"].map((item) => (
                        <ChoiceCard key={item} id={`expect-${item}`} name="expectedResult" value={item} checked={data.expectedResult === item} label={item} onChange={(value) => update("expectedResult", value)} />
                      ))}
                    </div>
                    <FieldError message={errors.expectedResult} />
                  </fieldset>

                  <div className="field-group">
                    <label htmlFor="valuable">哪一部分对你最有价值？ <em>必填</em></label>
                    <textarea id="valuable" value={data.valuable} onChange={(event) => update("valuable", event.target.value)} rows={3} placeholder="例如：用自己的历史样本做比较，而不是与别人比较……" aria-invalid={Boolean(errors.valuable)} />
                    <FieldError message={errors.valuable} />
                  </div>
                  <div className="field-group">
                    <label htmlFor="confusing">有没有让你困惑、不安或误解的内容？ <em>选填</em></label>
                    <textarea id="confusing" value={data.confusing} onChange={(event) => update("confusing", event.target.value)} rows={3} placeholder="请尽量写出当时看到的词语或页面位置……" />
                  </div>
                  <div className="field-group">
                    <label htmlFor="missing">你原本期待看到、但没有看到什么？ <em>选填</em></label>
                    <textarea id="missing" value={data.missing} onChange={(event) => update("missing", event.target.value)} rows={3} placeholder="功能、解释、语言支持或任何缺失的信息……" />
                  </div>
                  <div className="field-group highlight-field">
                    <label htmlFor="improvement">如果只能先改一件事，应该改什么？ <em>必填</em></label>
                    <textarea id="improvement" value={data.improvement} onChange={(event) => update("improvement", event.target.value)} rows={4} placeholder="最重要的一项改进建议……" aria-invalid={Boolean(errors.improvement)} />
                    <FieldError message={errors.improvement} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="step-content">
                  <fieldset className="field-group nps-group" id="nps" tabIndex={-1}>
                    <legend>你有多大可能向亲友推荐 KinaBot？ <em>必填</em></legend>
                    <div className="nps-scale" role="radiogroup" aria-label="0 到 10 分推荐意愿">
                      {Array.from({ length: 11 }, (_, index) => index).map((number) => (
                        <label key={number} className={data.nps === number ? "is-selected" : ""}>
                          <input type="radio" name="nps" checked={data.nps === number} onChange={() => update("nps", number)} />
                          <span>{number}</span>
                        </label>
                      ))}
                    </div>
                    <div className="rating-labels"><span>完全不可能</span><span>非常可能</span></div>
                    <FieldError message={errors.nps} />
                  </fieldset>

                  <fieldset className="field-group" id="futureUse" tabIndex={-1}>
                    <legend>你愿意继续参加 30 天体验吗？ <em>必填</em></legend>
                    <div className="choice-grid three-columns">
                      {["愿意", "还不确定", "暂时不愿意"].map((item) => (
                        <ChoiceCard key={item} id={`future-${item}`} name="futureUse" value={item} checked={data.futureUse === item} label={item} onChange={(value) => update("futureUse", value)} />
                      ))}
                    </div>
                    <FieldError message={errors.futureUse} />
                  </fieldset>

                  <fieldset className="field-group">
                    <legend>是否愿意参加一次 30 分钟线上访谈？</legend>
                    <div className="choice-grid two-columns">
                      <ChoiceCard id="interview-no" name="interviewInterest" value="no" checked={data.interviewInterest === "no"} label="这次先不参加" detail="反馈仍会正常提交" onChange={(value) => update("interviewInterest", value)} />
                      <ChoiceCard id="interview-yes" name="interviewInterest" value="yes" checked={data.interviewInterest === "yes"} label="愿意参加" detail="团队将通过邮箱联系" onChange={(value) => update("interviewInterest", value)} />
                    </div>
                  </fieldset>

                  {data.interviewInterest === "yes" && (
                    <div className="field-row conditional-panel">
                      <div className="field-group">
                        <label htmlFor="contactEmail">联系邮箱 <em>必填</em></label>
                        <input id="contactEmail" className="text-input" type="email" value={data.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(errors.contactEmail)} />
                        <FieldError message={errors.contactEmail} />
                      </div>
                      <div className="field-group">
                        <label htmlFor="contactLanguage">访谈语言</label>
                        <select id="contactLanguage" value={data.contactLanguage} onChange={(event) => update("contactLanguage", event.target.value)}>
                          <option value="zh">中文</option>
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <label className="simple-check" htmlFor="productUpdates">
                    <input id="productUpdates" type="checkbox" checked={data.productUpdates} onChange={(event) => update("productUpdates", event.target.checked)} />
                    <span className="check-box" aria-hidden="true">✓</span>
                    <span>我愿意偶尔收到 KinaBot 测试进展与下一轮邀请（选填，可随时退订）。</span>
                  </label>

                  <div className="final-consent-wrap">
                    <label className={`simple-check final-consent${data.finalConsent ? " is-checked" : ""}`} htmlFor="finalConsent">
                      <input id="finalConsent" type="checkbox" checked={data.finalConsent} onChange={(event) => update("finalConsent", event.target.checked)} />
                      <span className="check-box" aria-hidden="true">✓</span>
                      <span><strong>我同意 KinaBot 团队将这份反馈用于产品研究与改进。</strong><small>反馈可能被去标识化后汇总分析，不会用于医疗诊断或出售给第三方。</small></span>
                    </label>
                    <FieldError message={errors.finalConsent} />
                  </div>

                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={(event) => update("website", event.target.value)} />
                  </div>

                  {submitState === "error" && (
                    <div className="submit-error" role="alert">
                      暂时无法提交。你的草稿仍保存在本设备，请稍后再试。
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                {step > 0 ? (
                  <button className="button button-secondary" type="button" onClick={goBack}>← 上一步</button>
                ) : <span />}
                {step < steps.length - 1 ? (
                  <button className="button button-primary" type="button" onClick={goNext}>继续 <span>→</span></button>
                ) : (
                  <button className="button button-primary submit-button" type="submit" disabled={submitState === "submitting"}>
                    {submitState === "submitting" ? "正在安全提交…" : "提交深度反馈"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>

      <footer>
        <span>KinaBot · Dignity first, privacy aware</span>
        <span>非医疗器械 · 不提供诊断</span>
      </footer>
    </main>
  );
}
