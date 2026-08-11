import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function request(path = "/", init = undefined) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function render(path = "/") {
  return request(path, { headers: { accept: "text/html" } });
}

test("server-renders the KinaBot deep test form", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>KinaBot 深度用户反馈表单<\/title>/i);
  assert.match(html, /把真实问题，说清楚就好/);
  assert.match(html, /完成进度 17%/);
  assert.match(html, /这次反馈主要关于什么/);
  assert.match(html, /无法完成某项操作/);
  assert.match(html, /href="\/admin"/);
  assert.match(html, /维护者入口/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the maintainer feedback radar", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>反馈雷达 · KinaBot<\/title>/i);
  assert.match(html, /进入反馈雷达/);
  assert.match(html, /value=""/);
  const adminPage = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(adminPage, /反馈雷达/);
  assert.match(adminPage, /每 30 秒自动更新/);
  assert.match(adminPage, /复制洞察摘要/);
});

test("protects the feedback radar with a server-side password session", async () => {
  const [adminPage, insightRoute, sessionRoute, authHelper] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/insights/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8"),
  ]);
  assert.match(adminPage, /type="password"/);
  assert.match(adminPage, /进入反馈雷达/);
  assert.match(insightRoute, /hasAdminSession/);
  assert.match(sessionRoute, /verifyAdminPassword/);
  assert.match(adminPage, /authorization: `Bearer \$\{token\}`/);
  assert.match(adminPage, /window\.addEventListener\("pagehide"/);
  assert.match(adminPage, /window\.addEventListener\("pageshow"/);
  assert.match(adminPage, /autoComplete="new-password"/);
  assert.match(authHelper, /request\.headers\.get\("authorization"\)/);
  assert.doesNotMatch(authHelper, /cookie/i);
  assert.match(authHelper, /isLocalRequest\(request\) \? DEFAULT_ADMIN_PASSWORD : ""/);
  assert.match(authHelper, /DEFAULT_ADMIN_PASSWORD = "xyz123"/);
  assert.doesNotMatch(insightRoute, /oai-authenticated-user-email|FEEDBACK_ADMIN_EMAILS/);
  assert.doesNotMatch(adminPage, /signin-with-chatgpt|使用 ChatGPT 登录/);
});

test("removes the disposable starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /KinaBot deep feedback/);
  assert.match(layout, /KinaBot 深度用户反馈表单/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
