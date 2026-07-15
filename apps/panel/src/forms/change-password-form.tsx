import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePasswordMutation } from "@/queries/auth";

export const changePasswordFormSchema = z.object({
  current: z.string().min(1, "Current password is required."),
  next: z.string().min(8, "New password must be at least 8 characters."),
  confirm: z.string(),
}).refine((value) => value.next === value.confirm, {
  message: "New passwords do not match.",
  path: ["confirm"],
});

type Values = z.input<typeof changePasswordFormSchema>;

export function ChangePasswordForm() {
  const mutation = useChangePasswordMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const form = useForm({
    defaultValues: { current: "", next: "", confirm: "" } satisfies Values,
    onSubmit: async ({ value }) => {
      setError("");
      setSuccess("");
      const parsed = changePasswordFormSchema.safeParse(value);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || "Could not change the password.");
        return;
      }
      try {
        await mutation.mutateAsync({ current: parsed.data.current, next: parsed.data.next });
        form.reset();
        setSuccess("Password changed.");
      } catch (err) {
        setError(err instanceof ApiError ? (err.data as { error?: string } | null)?.error || err.message : "Could not change the password.");
      }
    },
  });

  return (
    <form className="grid max-w-sm gap-3" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}>
      <PasswordField form={form} name="current" label="Current password" autoComplete="current-password" disabled={mutation.isPending} />
      <PasswordField form={form} name="next" label="New password" autoComplete="new-password" disabled={mutation.isPending} />
      <PasswordField form={form} name="confirm" label="Confirm new password" autoComplete="new-password" disabled={mutation.isPending} />
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400" role="status">{success}</p> : null}
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Changing..." : "Change password"}</Button>
    </form>
  );
}

function PasswordField({ form, name, label, autoComplete, disabled }: { form: { Field: React.ComponentType<any> }; name: keyof Values; label: string; autoComplete: string; disabled?: boolean }) {
  return (
    <form.Field name={name}>
      {(field: { state: { value: unknown }; handleChange: (value: string) => void }) => (
        <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
          {label}
          <Input type="password" value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(event.target.value)} autoComplete={autoComplete} disabled={disabled} />
        </label>
      )}
    </form.Field>
  );
}
