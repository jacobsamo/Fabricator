import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setupFormSchema } from "@/forms/schemas";
import { useSetupMutation } from "@/queries/auth";

export function SetupPage() {
  const navigate = useNavigate();
  const setup = useSetupMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = setupFormSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid password.");
      return;
    }
    setError("");
    try {
      await setup.mutateAsync(parsed.data.password);
      await navigate({ to: "/", replace: true });
    } catch (err) {
      setPassword("");
      setConfirm("");
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "error" in err.data) {
        setError(String(err.data.error));
      } else {
        setError(err instanceof Error ? err.message : "Unable to finish setup.");
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set up Fabricator</CardTitle>
          <CardDescription>Create the operator password for this install.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoFocus
              autoComplete="new-password"
            />
            <Input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={setup.isPending}>
              {setup.isPending ? "Saving..." : "Create password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
