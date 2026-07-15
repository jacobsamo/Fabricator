import type { LogEntry } from "@/api/schemas";

const levelPattern = /\b(FATAL|SEVERE|ERROR|WARNING|WARN|INFO|DEBUG|TRACE)\b/;

export type LogLevel = "ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG";

export type ParsedLogLine = {
  id: string;
  stream: "stdout" | "stderr";
  tsMs: number;
  time: string;
  level: Exclude<LogLevel, "ALL">;
  message: string;
};

function normalizeLevel(raw: string): ParsedLogLine["level"] {
  if (raw === "FATAL" || raw === "SEVERE" || raw === "ERROR") return "ERROR";
  if (raw === "WARNING" || raw === "WARN") return "WARN";
  if (raw === "DEBUG" || raw === "TRACE") return "DEBUG";
  return "INFO";
}

function formatLocalTime(ts: string | null | undefined) {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const part = (value: number) => String(value).padStart(2, "0");
  return `${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}

function entryParts(entry: LogEntry) {
  if (typeof entry === "string") return { text: entry, ts: null };
  return { text: entry.text ?? "", ts: entry.ts ?? null };
}

function parseLine(entry: LogEntry, defaultLevel: ParsedLogLine["level"]) {
  const { text, ts } = entryParts(entry);
  const match = text.match(levelPattern);
  const level = match ? normalizeLevel(match[1] ?? "") : defaultLevel;
  const fallbackTime = text.match(/\[(\d{2}:\d{2}:\d{2})\]/)?.[1] ?? "";
  return {
    tsMs: ts ? Date.parse(ts) : Number.NaN,
    time: formatLocalTime(ts) || fallbackTime,
    level,
    message: text.replace(/^\s*\[\d{2}:\d{2}:\d{2}\]\s*/, ""),
  };
}

export function mergeLogLines(stdout: LogEntry[] = [], stderr: LogEntry[] = []) {
  const merged: ParsedLogLine[] = [
    ...stdout.map((entry, index) => ({ id: `stdout:${index}`, stream: "stdout" as const, ...parseLine(entry, "INFO") })),
    ...stderr.map((entry, index) => ({ id: `stderr:${index}`, stream: "stderr" as const, ...parseLine(entry, "ERROR") })),
  ];
  if (merged.length > 0 && merged.every((line) => Number.isFinite(line.tsMs))) {
    merged.sort((a, b) => a.tsMs - b.tsMs);
  }
  return merged;
}
