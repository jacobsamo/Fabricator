import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ open, title, description, children, className, onOpenChange }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[12vh]"
      role="presentation"
      onMouseDown={() => onOpenChange(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        className={cn("w-full max-w-md rounded-lg border border-border bg-popover text-popover-foreground shadow-xl", className)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="dialog-title" className="text-sm font-semibold">
              {title}
            </h2>
            {description ? (
              <p id="dialog-description" className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Close" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  description?: string;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  description,
  confirmText,
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <div className="space-y-4 px-4 py-4">
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="button" size="sm" disabled={loading} onClick={onConfirm}>
            {loading ? "Working..." : confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
