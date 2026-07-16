import { z } from "zod";

export const loginFormSchema = z.object({
  password: z.string().min(1, "Enter your password."),
});

export const setupFormSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string().min(1, "Confirm the password."),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwords must match.",
    path: ["confirm"],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type SetupFormValues = z.infer<typeof setupFormSchema>;

export const createServerFormSchema = z.object({
  name: z.string().trim().min(1, "Server name is required."),
  loader: z.string().min(1, "Choose a loader."),
  version: z.string().min(1, "Choose a Minecraft version."),
  port: z.coerce.number().int().min(1024, "Use a port above 1023.").max(65535, "Use a valid TCP port."),
  installPath: z.string(),
  memory: z.coerce.number().min(1, "Use at least 1 GB of memory.").max(64, "Use 64 GB or less."),
  maxPlayers: z.coerce.number().int().min(1, "Allow at least one player.").max(1000, "Use 1000 players or fewer."),
  difficulty: z.string().min(1),
  gamemode: z.string().min(1),
  eulaAccepted: z.boolean().refine(Boolean, "You must accept the Minecraft EULA."),
});

export type CreateServerFormValues = z.infer<typeof createServerFormSchema>;
