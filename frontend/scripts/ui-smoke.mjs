import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const headless = process.env.PW_HEADLESS !== "0";
const runId = Date.now();

const kbName = `Smoke KB ${runId}`;
const promptName = `Smoke Prompt ${runId}`;
const endpointName = `Smoke Endpoint ${runId}`;
const uploadFileName = `smoke-${runId}.txt`;
const uploadFileContents = [
  "這是一份 Playwright 驗收文件。",
  "主題是本地端 RAG 平台的 smoke test。",
  "如果檢索正常，回答應該提到 smoke test 或本地端 RAG 平台。",
].join("\n");

function logStep(message) {
  console.log(`\n[smoke] ${message}`);
}

async function waitForText(locator, timeout = 120000) {
  await locator.waitFor({ state: "visible", timeout });
  const text = (await locator.textContent())?.trim() ?? "";
  assert.notEqual(text, "", "Expected non-empty text content");
  return text;
}

async function runKnowledgeFlow(page, filePath) {
  logStep("Knowledge flow");
  await page.goto(`${baseUrl}/knowledge`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Knowledge Bases" }).waitFor();

  await page.getByRole("button", { name: "New Knowledge Base" }).click();
  await page.getByPlaceholder("Name").fill(kbName);
  await page.getByPlaceholder("Embedding model").fill("nomic-embed-text:latest");
  await page.getByPlaceholder("Description").fill("Playwright smoke knowledge base");
  await page.getByRole("button", { name: "Create" }).click();

  await page.getByRole("cell", { name: kbName }).waitFor({ timeout: 30000 });
  await page.getByText(`Documents · ${kbName}`).waitFor({ timeout: 30000 });

  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.getByText(uploadFileName).waitFor({ timeout: 180000 });
}

async function runPromptFlow(page) {
  logStep("Prompt flow");
  await page.goto(`${baseUrl}/prompts`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Prompt Templates" }).waitFor();

  await page.getByRole("button", { name: "New Template" }).click();
  await page.getByPlaceholder("Template name").fill(promptName);
  await page.getByPlaceholder("System prompt").fill("You are a concise smoke test assistant.");
  await page
    .getByPlaceholder("User prompt template")
    .fill("根據以下資料回答問題：\n\n{context}\n\n問題：{question}");
  await page.getByRole("button", { name: "Create Template" }).click();

  await page.getByRole("button", { name: promptName }).waitFor({ timeout: 30000 });

  const systemPromptField = page.getByPlaceholder("System prompt");
  const updatedSystemPrompt = "You are a concise smoke test assistant. Mention when retrieval worked.";
  await systemPromptField.fill(updatedSystemPrompt);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page.waitForFunction(
    ([selector, value]) => {
      const element = document.querySelector(selector);
      return Boolean(element) && "value" in element && element.value === value;
    },
    ["textarea[placeholder='System prompt']", updatedSystemPrompt],
    { timeout: 30000 },
  );
}

async function pickEndpointModel(createPanel) {
  const modelSelect = createPanel.locator("select").nth(2);
  await modelSelect.locator("option").nth(1).waitFor({ state: "attached", timeout: 30000 });
  const modelOptions = await modelSelect.locator("option").evaluateAll((options) =>
    options.map((option) => ({ value: option.value, label: option.textContent?.trim() ?? "" })),
  );

  const preferred = modelOptions.find((option) => /qwen/i.test(option.label))
    ?? modelOptions.find((option) => /gemma/i.test(option.label))
    ?? modelOptions.find((option) => option.value);

  assert.ok(preferred?.value, "No chat-capable model option found for endpoint creation");
  await modelSelect.selectOption(preferred.value);
}

async function runEndpointFlow(page) {
  logStep("Endpoint flow");
  await page.goto(`${baseUrl}/endpoints`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "API Endpoints" }).waitFor();

  const createPanel = page.getByRole("heading", { name: "Create Endpoint" }).locator("xpath=..");
  await createPanel.getByPlaceholder("Endpoint name").fill(endpointName);
  await createPanel.locator("select").nth(0).selectOption({ label: kbName });
  await createPanel.locator("select").nth(1).selectOption({ label: promptName });
  await pickEndpointModel(createPanel);
  await createPanel.getByRole("button", { name: "Create Endpoint" }).click();

  await page.getByRole("heading", { name: endpointName }).waitFor({ timeout: 30000 });

  const queryPanel = page.getByRole("heading", { name: "Query Endpoint" }).locator("xpath=..");
  await queryPanel.locator("select").selectOption({ label: endpointName });
  await queryPanel.getByPlaceholder("Ask a question...").fill("請用一句話說明這份知識庫文件的主題");
  await queryPanel.getByRole("button", { name: "Run Query" }).click();

  const answerPanel = queryPanel.getByText("Answer");
  await answerPanel.waitFor({ timeout: 240000 });
  const answerText = await waitForText(answerPanel.locator("xpath=following-sibling::p[1]"), 240000);
  assert.match(answerText, /smoke|RAG|本地端|平台/i, "Endpoint answer did not reflect uploaded knowledge");
}

async function selectKnowledgeBaseForChat(page) {
  const header = page.locator("header").first();
  const knowledgeButton = header.getByRole("button", { name: /Knowledge Base|No Knowledge Base|Smoke KB|Test/i }).last();
  await knowledgeButton.click();
  await page.getByRole("menuitem", { name: new RegExp(`${kbName} \(.*\)`) }).click();
}

async function runChatFlow(page) {
  logStep("Chat flow");
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.getByText("Data ready").waitFor({ timeout: 30000 });

  const header = page.locator("header").first();
  const modelTriggerText = await header.getByRole("button").first().textContent();
  assert.ok(!/bge-m3|nomic-embed-text/i.test(modelTriggerText ?? ""), "Chat defaulted to an embedding model");

  await selectKnowledgeBaseForChat(page);

  const composer = page.getByPlaceholder(/Ask a grounded question based on the selected knowledge base/i);
  await composer.fill("請用一句話說明這份知識庫文件的主題");
  await composer.press("Enter");

  await page.waitForFunction(() => {
    const articles = Array.from(document.querySelectorAll("article"));
    if (articles.length < 2) {
      return false;
    }
    const lastText = articles[articles.length - 1]?.textContent?.trim() ?? "";
    return lastText.length > 0;
  }, undefined, { timeout: 240000 });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll("button")).some((element) => {
      const text = element.textContent ?? "";
      return /Session .*· \d+ msgs|Session .*/i.test(text);
    });
  }, undefined, { timeout: 240000 });

  const transcript = await waitForText(page.locator("article").last(), 240000);
  assert.ok(!/does not support chat/i.test(transcript), "Chat flow still hit a non-chat model");
}

async function runModelsFlow(page) {
  logStep("Models flow");
  await page.goto(`${baseUrl}/models`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Ollama Models" }).waitFor();
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll("td")).some((element) => {
      const text = element.textContent ?? "";
      return /gemma4:e4b|qwen3.5:4b|bge-m3:latest/i.test(text);
    });
  }, undefined, { timeout: 30000 });
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), "rag-chat-smoke-"));
  const filePath = join(tempDir, uploadFileName);
  await writeFile(filePath, uploadFileContents, "utf8");

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on("pageerror", (error) => {
    console.error("[pageerror]", error);
  });

  try {
    await runKnowledgeFlow(page, filePath);
    await runPromptFlow(page);
    await runEndpointFlow(page);
    await runChatFlow(page);
    await runModelsFlow(page);
    console.log("\n[smoke] All smoke checks passed");
  } finally {
    await context.close();
    await browser.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("\n[smoke] FAILED");
  console.error(error);
  process.exitCode = 1;
});