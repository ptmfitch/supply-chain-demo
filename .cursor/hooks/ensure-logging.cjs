#!/usr/bin/env node
/**
 * afterFileEdit / stop: require @/lib/logger (not console) on TS/JS error paths.
 *
 * Reads hook JSON from stdin. Fail-open: invalid input or crashes emit {}.
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TS_JS_RE = /\.(tsx?|jsx?)$/i;
const SKIP_PATH_RE =
  /(?:^|\/)(?:node_modules|\.next|coverage|\.cursor\/hooks|scripts)\//i;
const SKIP_FILE_RE =
  /(?:\.(?:test|spec)\.(?:tsx?|jsx?)$|(?:^|\/)lib\/logger\.ts$|(?:^|\/)next-env\.d\.ts$|\.d\.ts$|(?:^|\/)(?:instrumentation|instrumentation-client|sentry\.(?:server|edge|client)\.config)\.ts$)/i;

const CONSOLE_CALL_RE = /\bconsole\.(?:log|error|warn|info|debug)\s*\(/;
const CATCH_RE = /\bcatch\s*(?:\([^)]*\))?\s*\{/g;
const VALIDATION_HINT_RE =
  /\b(?:safeParse|onInvalid|invalid(?:ate)?\s+\w+\s+data|Invalid \w+ data)\b/i;
const LOGGER_ERROR_RE = /\blogger\.error\s*\(/;
const LOGGING_CALL_RE =
  /\b(?:logger\.(?:error|warn|info|debug|log)|errorResponse|serviceUnavailableResponse|captureException|captureMessage)\s*\(/;
const RETHROW_RE = /\bthrow\b/;
const HANDLER_RE =
  /\bexport\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE)\b/;

function failOpen() {
  process.stdout.write("{}\n");
  process.exit(0);
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function posixPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function shouldSkipFile(filePath) {
  const n = posixPath(filePath);
  if (!TS_JS_RE.test(n)) {
    return true;
  }
  if (SKIP_PATH_RE.test(n) || SKIP_FILE_RE.test(n)) {
    return true;
  }
  return false;
}

function isAppSource(filePath) {
  const n = posixPath(filePath);
  return /(?:^|\/)(?:app|lib|hooks|components|prisma|contexts|middleware|utils)\//.test(
    n,
  );
}

function isErrorPathSource(filePath) {
  const n = posixPath(filePath);
  return /(?:^|\/)(?:app\/api|lib|hooks|prisma|middleware|utils)\//.test(n);
}

function isApiRoute(filePath) {
  return /(?:^|\/)app\/api\/.+\broute\.(tsx?|jsx?)$/.test(posixPath(filePath));
}

function stripComments(src) {
  return String(src)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function skipStringLiteral(text, start) {
  const quote = text[start];
  if (quote !== '"' && quote !== "'" && quote !== "`") {
    return start;
  }
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === quote) {
      return i;
    }
    i += 1;
  }
  return text.length - 1;
}

/** Inclusive `{` … matching `}`; skips quotes so nested `}` is not a closer. */
function extractBalancedBlock(text, openBraceIndex) {
  if (text[openBraceIndex] !== "{") {
    return "";
  }
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipStringLiteral(text, i);
      continue;
    }
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(openBraceIndex, i + 1);
      }
    }
  }
  return text.slice(openBraceIndex);
}

function hasLoggerErrorOnValidationPath(text) {
  if (!VALIDATION_HINT_RE.test(text) || !LOGGER_ERROR_RE.test(text)) {
    return false;
  }

  const onInvalidRe = /\bonInvalid\b/g;
  let match;
  while ((match = onInvalidRe.exec(text)) !== null) {
    const afterStart = match.index + match[0].length;
    const after = text.slice(afterStart, afterStart + 200);
    if (/=>\s*logger\.error\s*\(/.test(after)) {
      return true;
    }
    const braceOffset = after.indexOf("{");
    if (braceOffset !== -1 && braceOffset < 80) {
      const body = extractBalancedBlock(text, afterStart + braceOffset);
      if (LOGGER_ERROR_RE.test(body)) {
        return true;
      }
    }
  }

  const safeParseRe = /\bsafeParse\b/g;
  while ((match = safeParseRe.exec(text)) !== null) {
    const region = text.slice(match.index, match.index + 500);
    const ifMatch = /if\s*\(\s*![\w$.]+\.success\s*\)\s*\{/.exec(region);
    if (!ifMatch) {
      continue;
    }
    const braceIndex = match.index + ifMatch.index + ifMatch[0].length - 1;
    const body = extractBalancedBlock(text, braceIndex);
    if (LOGGER_ERROR_RE.test(body)) {
      return true;
    }
  }

  return /\blogger\.error\s*\(\s*[`'"][^`'"]*\b(?:Invalid \w+ data|invalid(?:ate)?\s+\w+\s+data)\b/i.test(
    text,
  );
}

function findingsPath(workspaceRoot, conversationId) {
  const key = crypto
    .createHash("sha256")
    .update(`${workspaceRoot || ""}:${conversationId || "default"}`)
    .digest("hex")
    .slice(0, 16);
  return path.join(os.tmpdir(), `cursor-scd-logging-${key}.json`);
}

function loadFindings(storePath) {
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function saveFindings(storePath, findingsByFile) {
  const remaining = Object.fromEntries(
    Object.entries(findingsByFile).filter(
      ([, items]) => Array.isArray(items) && items.length > 0,
    ),
  );
  if (Object.keys(remaining).length === 0) {
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore
    }
    return;
  }
  fs.writeFileSync(storePath, JSON.stringify(remaining), "utf8");
}

function analyzeText(filePath, source) {
  const findings = [];
  const text = stripComments(source);
  if (!text.trim()) {
    return findings;
  }

  if (isAppSource(filePath) && CONSOLE_CALL_RE.test(text)) {
    findings.push(
      "Use `logger` from `@/lib/logger` instead of `console.*` (prod sends errors to Sentry via logger; console is a no-op).",
    );
  }

  if (hasLoggerErrorOnValidationPath(text)) {
    findings.push(
      "Validation / Zod `safeParse` / RHF `onInvalid` must use `logger.warn`, not `logger.error` (error routes to Sentry).",
    );
  }

  if (isErrorPathSource(filePath)) {
    CATCH_RE.lastIndex = 0;
    let match;
    while ((match = CATCH_RE.exec(text)) !== null) {
      const openBrace = match.index + match[0].length - 1;
      const body = extractBalancedBlock(text, openBrace);
      if (LOGGING_CALL_RE.test(body) || RETHROW_RE.test(body)) {
        continue;
      }
      findings.push(
        "Catch block has no logging. Unexpected failures: `logger.error(\"label:\", error)`. Expected 4xx / validation: `logger.warn`. API helpers `errorResponse` / `serviceUnavailableResponse` already log.",
      );
      break;
    }
  }

  if (
    isApiRoute(filePath) &&
    HANDLER_RE.test(text) &&
    !/\bcatch\b/.test(text) &&
    !LOGGING_CALL_RE.test(text)
  ) {
    findings.push(
      "New App Router handler has no try/catch logging. Wrap the handler and log unexpected errors with `logger.error(\"label:\", error)`.",
    );
  }

  return [...new Set(findings)];
}

function analyzeEdits(filePath, edits) {
  if (!Array.isArray(edits) || edits.length === 0) {
    return [];
  }
  const newText = edits
    .map((edit) =>
      edit && typeof edit.new_string === "string" ? edit.new_string : "",
    )
    .join("\n");
  const oldText = edits
    .map((edit) =>
      edit && typeof edit.old_string === "string" ? edit.old_string : "",
    )
    .join("\n");
  const nextFindings = analyzeText(filePath, newText);
  if (nextFindings.length === 0) {
    return [];
  }
  const prior = new Set(analyzeText(filePath, oldText));
  return nextFindings.filter((item) => !prior.has(item));
}

function displayPath(filePath, workspaceRoot) {
  const n = posixPath(filePath);
  const root = posixPath(workspaceRoot).replace(/\/$/, "");
  if (root && n.startsWith(`${root}/`)) {
    return n.slice(root.length + 1);
  }
  return n;
}

function formatAdditionalContext(filePath, findings, workspaceRoot) {
  const rel = displayPath(filePath, workspaceRoot);
  const bullets = findings.map((item) => `- ${item}`).join("\n");
  return [
    `Logging review failed for \`${rel}\`. Fix logging in this edit before continuing.`,
    bullets,
    "Rules: import `{ logger }` from `@/lib/logger`. `logger.error` is for unexpected 5xx (pass the Error as the second arg). `logger.warn` is for 4xx, Zod `safeParse` failures, and RHF `onInvalid`. Do not call `console.*` in app/lib/hooks/components/prisma.",
  ].join("\n");
}

function formatFollowup(findingsByFile, workspaceRoot) {
  const blocks = Object.entries(findingsByFile).map(([file, items]) => {
    const bullets = items.map((item) => `- ${item}`).join("\n");
    return `\`${displayPath(file, workspaceRoot)}\`:\n${bullets}`;
  });
  return [
    "Logging review: the previous TypeScript/JavaScript edits are missing required logging. Apply the fixes below, then stop.",
    ...blocks,
    "Use `logger` from `@/lib/logger`. `logger.error(\"label:\", error)` for unexpected failures; `logger.warn` for validation/4xx. No `console.*` in application code.",
  ].join("\n\n");
}

function handleAfterFileEdit(input) {
  const filePath = input.file_path || "";
  const workspaceRoot = Array.isArray(input.workspace_roots)
    ? input.workspace_roots[0]
    : "";
  const conversationId = input.conversation_id || input.session_id || "";
  const storePath = findingsPath(workspaceRoot, conversationId);
  const findingsByFile = loadFindings(storePath);

  if (shouldSkipFile(filePath)) {
    if (findingsByFile[filePath]) {
      delete findingsByFile[filePath];
      saveFindings(storePath, findingsByFile);
    }
    process.stdout.write("{}\n");
    return;
  }

  const findings = analyzeEdits(filePath, input.edits);
  if (findings.length === 0) {
    delete findingsByFile[filePath];
    saveFindings(storePath, findingsByFile);
    process.stdout.write("{}\n");
    return;
  }

  findingsByFile[filePath] = findings;
  saveFindings(storePath, findingsByFile);
  process.stdout.write(
    JSON.stringify({
      additional_context: formatAdditionalContext(
        filePath,
        findings,
        workspaceRoot,
      ),
    }) + "\n",
  );
}

function handleStop(input) {
  if (input.status && input.status !== "completed") {
    process.stdout.write("{}\n");
    return;
  }
  const workspaceRoot = Array.isArray(input.workspace_roots)
    ? input.workspace_roots[0]
    : "";
  const conversationId = input.conversation_id || input.session_id || "";
  const storePath = findingsPath(workspaceRoot, conversationId);
  const findingsByFile = loadFindings(storePath);
  if (Object.keys(findingsByFile).length === 0) {
    process.stdout.write("{}\n");
    return;
  }
  process.stdout.write(
    JSON.stringify({
      followup_message: formatFollowup(findingsByFile, workspaceRoot),
    }) + "\n",
  );
}

function main() {
  const raw = readStdin().trim();
  if (!raw) {
    failOpen();
  }
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    failOpen();
  }
  if (!input || typeof input !== "object") {
    failOpen();
  }

  const event = input.hook_event_name || "";
  if (event === "stop") {
    handleStop(input);
    return;
  }
  handleAfterFileEdit(input);
}

if (process.argv.includes("--self-test")) {
  const assert = (cond, msg) => {
    if (!cond) {
      throw new Error(msg);
    }
  };
  assert(shouldSkipFile("lib/logger.ts"), "skip logger hub");
  assert(shouldSkipFile("app/api/products/route.test.ts"), "skip tests");
  assert(shouldSkipFile("scripts/reset-demo-db.ts"), "skip scripts");
  assert(!shouldSkipFile("app/api/products/route.ts"), "keep API routes");

  const consoleHits = analyzeText(
    "lib/cache/post-mutation.ts",
    'console.error("Deferred invalidate failed:", error);\n',
  );
  assert(consoleHits.length === 1, "flag console.error");

  const warnOk = analyzeText(
    "app/api/products/route.ts",
    'if (!parsed.success) {\n  logger.warn("Invalid product data", { issues: parsed.error.issues });\n  return NextResponse.json({ error: "Invalid" }, { status: 400 });\n}\n',
  );
  assert(warnOk.length === 0, "logger.warn on Zod is fine");

  const errorOnZod = analyzeText(
    "app/api/products/route.ts",
    'const parsed = createProductBodySchema.safeParse(body);\nif (!parsed.success) {\n  logger.error("Invalid product data", parsed.error);\n}\n',
  );
  assert(errorOnZod.some((f) => f.includes("logger.warn")), "flag logger.error on Zod");

  const silentCatch = analyzeText(
    "app/api/orders/route.ts",
    "try {\n  await createOrder();\n} catch (error) {\n  return NextResponse.json({ error: \"Failed\" }, { status: 500 });\n}\n",
  );
  assert(silentCatch.some((f) => f.includes("Catch block")), "flag silent catch");

  const loggedCatch = analyzeText(
    "app/api/orders/route.ts",
    'try {\n  await createOrder();\n} catch (error) {\n  logger.error("Error creating order:", error);\n  return NextResponse.json({ error: "Failed" }, { status: 500 });\n}\n',
  );
  assert(loggedCatch.length === 0, "logged catch is fine");

  const existingConsole = analyzeEdits("lib/cache/post-mutation.ts", [
    {
      old_string: 'console.error("Deferred invalidate failed:", error);\n',
      new_string:
        'console.error("Deferred invalidate failed:", error);\nreturn;\n',
    },
  ]);
  assert(existingConsole.length === 0, "do not re-flag existing console");

  const newConsole = analyzeEdits("lib/cache/post-mutation.ts", [
    {
      old_string: "return;\n",
      new_string:
        'console.error("Deferred invalidate failed:", error);\nreturn;\n',
    },
  ]);
  assert(newConsole.length === 1, "flag newly introduced console");

  const warnPlusCatchError = analyzeText(
    "app/api/categories/route.ts",
    [
      "export async function POST(request) {",
      "  try {",
      "    const parsed = createCategoryBodySchema.safeParse(body);",
      "    if (!parsed.success) {",
      '      logger.warn("Invalid category data", { issues: parsed.error.issues });',
      "      return NextResponse.json({ error: \"Invalid\" }, { status: 400 });",
      "    }",
      "  } catch (error) {",
      '    logger.error("Error creating category:", error);',
      "    return NextResponse.json({ error: \"Failed\" }, { status: 500 });",
      "  }",
      "}",
      "",
    ].join("\n"),
  );
  assert(warnPlusCatchError.length === 0, "safeParse warn + catch error is fine");

  const onInvalidError = analyzeText(
    "components/products/ProductFormDialog.tsx",
    'onInvalid={(errors) => {\n  logger.error("Invalid product data", errors);\n}}\n',
  );
  assert(onInvalidError.some((f) => f.includes("logger.warn")), "flag logger.error on onInvalid");

  const nestedCatchObject = analyzeText(
    "app/api/orders/route.ts",
    [
      "try {",
      "  await createOrder();",
      "} catch (error) {",
      "  const details = { id: orderId, reason: \"failed\" };",
      '  logger.error("Error creating order:", error);',
      "  return NextResponse.json({ error: \"Failed\" }, { status: 500 });",
      "}",
      "",
    ].join("\n"),
  );
  assert(nestedCatchObject.length === 0, "catch with nested braces before logger is fine");

  const nestedCatchIf = analyzeText(
    "app/api/orders/route.ts",
    [
      "try {",
      "  await createOrder();",
      "} catch (error) {",
      "  if (isExpectedClientError(error)) {",
      '    logger.warn("Expected order error", error);',
      "    return NextResponse.json({ error: \"Invalid\" }, { status: 400 });",
      "  }",
      '  logger.error("Error creating order:", error);',
      "  return NextResponse.json({ error: \"Failed\" }, { status: 500 });",
      "}",
      "",
    ].join("\n"),
  );
  assert(nestedCatchIf.length === 0, "catch with inner if before logger is fine");

  const silentNestedCatch = analyzeText(
    "app/api/orders/route.ts",
    [
      "try {",
      "  await createOrder();",
      "} catch (error) {",
      "  const details = { id: orderId, reason: \"failed\" };",
      "  return NextResponse.json({ error: \"Failed\" }, { status: 500 });",
      "}",
      "",
    ].join("\n"),
  );
  assert(
    silentNestedCatch.some((f) => f.includes("Catch block")),
    "flag silent catch even with nested braces",
  );

  assert(shouldSkipFile("README.md"), "skip non-ts");

  process.stdout.write("self-test ok\n");
  process.exit(0);
}

try {
  main();
} catch {
  failOpen();
}
