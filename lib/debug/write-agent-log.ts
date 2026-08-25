"use server";

import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const DEBUG_LOG_PATH = "/opt/cursor/logs/debug.log";

/** Temporary debug-mode sink for client layout probes. Remove after SCD-7. */
export async function writeAgentDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  runId?: string;
  data?: Record<string, unknown>;
}) {
  try {
    mkdirSync(dirname(DEBUG_LOG_PATH), { recursive: true });
    appendFileSync(
      DEBUG_LOG_PATH,
      `${JSON.stringify({
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        ...payload,
      })}\n`,
    );
  } catch {
    // Probe must never break the UI.
  }
}
