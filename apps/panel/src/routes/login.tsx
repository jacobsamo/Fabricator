import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginFormSchema } from "@/forms/schemas";
import { getSafeRedirect } from "@/lib/auth-guard";
import { useLoginMutation } from "@/queries/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const login = useLoginMutation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginFormSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid password.");
      return;
    }
    setError("");
    try {
      await login.mutateAsync(parsed.data.password);
      await navigate({ href: getSafeRedirect(search.redirect), replace: true });
    } catch (err) {
      setPassword("");
      if (err instanceof ApiError && err.status === 401) {
        setError("Incorrect password.");
      } else {
        setError(err instanceof Error ? err.message : "Unable to sign in.");
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Unlock Fabricator</CardTitle>
          <CardDescription>Enter the operator password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Unlocking..." : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
