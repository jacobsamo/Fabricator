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
