import { z } from "zod";

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
});

export const serversSchema = z.array(serverSummarySchema);

export type AuthStatus = z.infer<typeof authStatusSchema>;
export type ServerSummary = z.infer<typeof serverSummarySchema>;
