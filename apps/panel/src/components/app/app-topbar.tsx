import { Command, Lock, RefreshCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/queries/auth";

export function AppTopbar() {
  const navigate = useNavigate();
  const logout = useLogoutMutation();

  return (
    <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-border bg-background/95 px-5">
      <div className="flex min-w-0 flex-col">
        <div className="text-sm font-medium">Servers / Panel preview</div>
        <div className="text-xs text-muted-foreground">React, TanStack, shadcn, Base UI, and Tailwind</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Command data-icon="inline-start" />
          Command
        </Button>
        <Button variant="ghost" size="icon" aria-label="Refresh visible data">
          <RefreshCcw />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Lock Fabricator"
          disabled={logout.isPending}
          onClick={async () => {
            await logout.mutateAsync();
            await navigate({ to: "/login", search: { redirect: undefined }, replace: true });
          }}
        >
          <Lock />
        </Button>
      </div>
    </header>
  );
}
