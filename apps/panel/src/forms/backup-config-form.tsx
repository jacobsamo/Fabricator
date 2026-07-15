import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import type { BackupConfigPayload } from "@/api/backups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const backupConfigFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  storagePath: z.string(),
  maxSnapshots: z.coerce.number().int().min(0),
  flush: z.boolean(),
  shutdown: z.boolean(),
  compress: z.boolean(),
  exclusions: z.string(),
  scheduleEnabled: z.boolean(),
  frequencyHours: z.coerce.number().int().min(1),
  timeOfDay: z.string().min(1),
});

export type BackupConfigFormValues = z.input<typeof backupConfigFormSchema>;

export function backupConfigToValues(config?: Record<string, unknown> | null, defaultStoragePath = ""): BackupConfigFormValues {
  const schedule = config?.schedule && typeof config.schedule === "object" ? (config.schedule as Record<string, unknown>) : {};
  return {
    name: typeof config?.name === "string" ? config.name : "",
    storagePath: typeof config?.storagePath === "string" ? config.storagePath : defaultStoragePath,
    maxSnapshots: typeof config?.maxSnapshots === "number" ? config.maxSnapshots : 7,
    flush: config?.flush !== false,
    shutdown: Boolean(config?.shutdown),
    compress: config?.compress !== false,
    exclusions: Array.isArray(config?.exclusions) ? config.exclusions.join("\n") : "",
    scheduleEnabled: Boolean(schedule.enabled ?? true),
    frequencyHours: typeof schedule.frequencyHours === "number" ? schedule.frequencyHours : 24,
    timeOfDay: typeof schedule.timeOfDay === "string" ? schedule.timeOfDay : "03:00",
  };
}

export function backupConfigPayload(values: BackupConfigFormValues): BackupConfigPayload {
  const parsed = backupConfigFormSchema.parse(values);
  return {
    name: parsed.name,
    storagePath: parsed.storagePath.trim(),
    maxSnapshots: parsed.maxSnapshots,
    flush: parsed.flush,
    shutdown: parsed.shutdown,
    compress: parsed.compress,
    exclusions: parsed.exclusions.split("\n").map((line) => line.trim()).filter(Boolean),
    schedule: {
      enabled: parsed.scheduleEnabled,
      frequencyHours: parsed.frequencyHours,
      timeOfDay: parsed.timeOfDay,
    },
  };
}

export function BackupConfigForm({
  config,
  defaultStoragePath,
  disabled,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  config?: Record<string, unknown> | null;
  defaultStoragePath?: string;
  disabled?: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: BackupConfigPayload) => Promise<void> | void;
}) {
  const form = useForm({
    defaultValues: backupConfigToValues(config, defaultStoragePath),
    onSubmit: async ({ value }) => onSubmit(backupConfigPayload(value)),
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => <Field label="Name"><Input value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(event.target.value)} disabled={disabled} /></Field>}
      </form.Field>
      <form.Field name="storagePath">
        {(field) => <Field label="Storage path"><Input value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(event.target.value)} disabled={disabled} placeholder="/absolute/path/to/backups" /></Field>}
      </form.Field>
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="maxSnapshots">
          {(field) => <Field label="Max snapshots"><Input type="number" min={0} value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(Number(event.target.value))} disabled={disabled} /></Field>}
        </form.Field>
        <form.Field name="timeOfDay">
          {(field) => <Field label="Time of day"><Input type="time" value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(event.target.value)} disabled={disabled} /></Field>}
        </form.Field>
      </div>
      <form.Field name="frequencyHours">
        {(field) => (
          <Field label="Frequency">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={String(field.state.value)} onChange={(event) => field.handleChange(Number(event.target.value))} disabled={disabled}>
              {[1, 6, 12, 24, 168].map((hours) => <option key={hours} value={hours}>{hours === 1 ? "Every hour" : hours === 24 ? "Daily" : hours === 168 ? "Weekly" : `Every ${hours}h`}</option>)}
            </select>
          </Field>
        )}
      </form.Field>
      <form.Field name="exclusions">
        {(field) => (
          <Field label="Exclusions">
            <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" value={String(field.state.value ?? "")} onChange={(event) => field.handleChange(event.target.value)} disabled={disabled} placeholder={"logs/**\ncrash-reports/**"} />
          </Field>
        )}
      </form.Field>
      <div className="grid gap-2">
        <CheckboxField form={form} name="scheduleEnabled" label="Enable schedule" disabled={disabled} />
        <CheckboxField form={form} name="flush" label="Flush before backup" disabled={disabled} />
        <CheckboxField form={form} name="shutdown" label="Stop server before backup" disabled={disabled} />
        <CheckboxField form={form} name="compress" label="Compress archives" disabled={disabled} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={disabled}>Cancel</Button>
        <Button type="submit" disabled={disabled}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">{label}{children}</label>;
}

function CheckboxField({ form, name, label, disabled }: { form: { Field: React.ComponentType<any> }; name: keyof BackupConfigFormValues; label: string; disabled?: boolean }) {
  return (
    <form.Field name={name}>
      {(field: { state: { value: unknown }; handleChange: (value: boolean) => void }) => (
        <label className="flex items-center gap-2 text-sm text-secondary-foreground">
          <input type="checkbox" checked={Boolean(field.state.value)} onChange={(event) => field.handleChange(event.target.checked)} disabled={disabled} />
          {label}
        </label>
      )}
    </form.Field>
  );
}
