import { z } from "zod";

export const unknownRecordSchema = z.record(z.string(), z.unknown());
export const unknownRecordsSchema = z.array(unknownRecordSchema);

export const authStatusSchema = z.object({
  authenticated: z.boolean(),
  enabled: z.boolean(),
  needs_setup: z.boolean(),
}).transform((value) => ({
  authenticated: value.authenticated,
  enabled: value.enabled,
  needsSetup: value.needs_setup,
}));

export const serverSummarySchema = z.object({
  id: z.string(),
  name: z.string().default("Minecraft Server"),
  loader: z.string().optional(),
  status: z.string().optional(),
  version: z.string().optional(),
  runtime: z.object({
    status: z.string().optional(),
  }).passthrough().optional(),
  players: z.object({
    online: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
}).passthrough();

export const serversSchema = z.array(serverSummarySchema);
export const serverDetailSchema = serverSummarySchema.passthrough();
export const mutationResultSchema = unknownRecordSchema;

export const logEntrySchema = z.union([
  z.string(),
  z.object({
    ts: z.string().nullable().optional(),
    text: z.string().optional(),
  }).passthrough(),
]);

export const serverLogsSchema = z.object({
  stdout: z.array(logEntrySchema).default([]),
  stderr: z.array(logEntrySchema).default([]),
  logs: z.array(logEntrySchema).default([]),
  running: z.boolean().optional(),
}).passthrough();

export const installedModSchema = z.object({
  name: z.string(),
  filename: z.string().optional(),
  size: z.number().optional(),
  updatedAt: z.string().optional(),
  path: z.string().optional(),
  relativePath: z.string().optional(),
  isDir: z.boolean().optional(),
}).passthrough();

export const installedModsSchema = z.array(installedModSchema);

export const fileEntrySchema = z.object({
  name: z.string(),
  size: z.number().optional(),
  updatedAt: z.string().optional(),
  modified: z.string().optional(),
  type: z.string().optional(),
  path: z.string().optional(),
  relativePath: z.string().optional(),
  isDir: z.boolean().default(false),
}).passthrough();

export const fileBrowserSchema = z.object({
  currentPath: z.string().default(""),
  path: z.string().default(""),
  absolutePath: z.string().optional(),
  entries: z.array(fileEntrySchema).default([]),
}).passthrough();

export const fileContentSchema = z.object({
  path: z.string().optional(),
  content: z.string().default(""),
  encoding: z.string().optional(),
}).passthrough();

export const metricsSchema = unknownRecordSchema;
export const installProgressSchema = unknownRecordSchema;
export const loaderGameVersionsSchema = z.array(unknownRecordSchema);
export const loaderVersionsSchema = z.array(unknownRecordSchema);
export const systemMetricsSchema = unknownRecordSchema;

export const javaStatusSchema = unknownRecordSchema;
export const javaInstallTaskSchema = unknownRecordSchema;
export const javaInstallProgressSchema = unknownRecordSchema;
export const installedJavaSchema = unknownRecordSchema;
export const updateStatusSchema = z.object({
  inProgress: z.boolean().default(false),
  currentVersion: z.string().nullable().optional(),
  latestVersion: z.string().nullable().optional(),
  updateAvailable: z.boolean().default(false),
  selfUpdateDisabled: z.boolean().default(false),
  lastError: z.string().nullable().optional(),
  lastExitCode: z.number().nullable().optional(),
  lastRequestedVersion: z.string().nullable().optional(),
}).passthrough();

export const updateTriggerResultSchema = z.object({
  started: z.boolean().default(false),
  requestedVersion: z.string().optional(),
  selfUpdateDisabled: z.boolean().optional(),
  error: z.string().optional(),
}).passthrough();

export const playersStateSchema = unknownRecordSchema;
export const onlinePlayersSchema = z.union([unknownRecordsSchema, unknownRecordSchema]);

export const backupConfigsSchema = unknownRecordsSchema;
export const backupConfigSchema = unknownRecordSchema;
export const snapshotsSchema = unknownRecordsSchema;
export const backupSummarySchema = unknownRecordSchema;
export const backupJobSchema = unknownRecordSchema;
export const backupJobStartSchema = z.object({
  job_id: z.string(),
}).passthrough();

export const playitStatusSchema = z.object({
  status: z.string(),
  claim_url: z.string().nullable().optional(),
  error_reason: z.string().nullable().optional(),
  binary_verified: z.boolean().optional(),
  tunnels: z.array(unknownRecordSchema).optional(),
  tunnels_known: z.boolean().optional(),
}).passthrough();

export const modrinthSearchSchema = z.object({
  hits: z.array(unknownRecordSchema).default([]),
}).passthrough();
export const modrinthProjectSchema = unknownRecordSchema;
export const modrinthVersionsSchema = z.array(unknownRecordSchema);
export const modrinthInstallProgressSchema = unknownRecordSchema;
export const modrinthCategoriesSchema = z.array(z.union([z.string(), unknownRecordSchema]));
export const modrinthLoadersSchema = z.array(z.union([z.string(), unknownRecordSchema]));
export const modrinthGameVersionsSchema = z.array(z.union([z.string(), unknownRecordSchema]));

export type AuthStatus = z.infer<typeof authStatusSchema>;
export type ServerSummary = z.infer<typeof serverSummarySchema>;
export type ServerDetail = z.infer<typeof serverDetailSchema>;
export type MutationResult = z.infer<typeof mutationResultSchema>;
export type UpdateStatus = z.infer<typeof updateStatusSchema>;
export type UpdateTriggerResult = z.infer<typeof updateTriggerResultSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type ServerLogs = z.infer<typeof serverLogsSchema>;
export type InstalledMod = z.infer<typeof installedModSchema>;
export type FileEntry = z.infer<typeof fileEntrySchema>;
export type FileBrowser = z.infer<typeof fileBrowserSchema>;
export type FileContent = z.infer<typeof fileContentSchema>;
export type BackupJobStart = z.infer<typeof backupJobStartSchema>;
export type PlayitStatus = z.infer<typeof playitStatusSchema>;
