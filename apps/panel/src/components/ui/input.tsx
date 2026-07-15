import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-secondary-foreground outline-none transition placeholder:text-[#555555] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-primary focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
