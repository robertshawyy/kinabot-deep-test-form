# KinaBot 深度体验计划表单

这是一个与 `aoi_kinabot_app/` 完全独立的深度测试反馈网页。它不会导入或修改 KinaBot 应用代码。

## 表单内容

- 五步响应式中文表单：测试背景、知情同意、任务记录、深度反馈与后续联系
- 逐步必填校验、键盘可用性和移动端布局
- 本设备自动保存未提交草稿
- Cloudflare D1 持久化提交结果，并生成随机反馈编号
- 明确的隐私、语音同意和非医疗器械边界
- Open Graph / X 分享预览图

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

常用检查：

```bash
npm test
npx tsc --noEmit
```

数据库迁移位于 `drizzle/`，修改 `db/schema.ts` 后运行：

```bash
npm run db:generate
```

请勿在反馈文本中收集病历、诊断、完整转写或未经同意的第三方信息。
