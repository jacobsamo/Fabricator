import { isRedirect, redirect } from "@tanstack/react-router";

import { queryClient } from "@/lib/query-client";
import { authStatusQuery } from "@/queries/auth";

type GuardLocation = {
  pathname: string;
  search?: Record<string, unknown>;
};

export function getSafeRedirect(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function redirectTarget(location: GuardLocation) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(location.search || {})) {
    if (value != null) search.set(key, String(value));
  }
  const query = search.toString();
  return `${location.pathname}${query ? `?${query}` : ""}`;
}

export async function requireAppAuth(location: GuardLocation) {
  try {
    const status = await queryClient.ensureQueryData(authStatusQuery);
    if (!status.enabled) return;
    if (status.needsSetup) {
      throw redirect({ to: "/setup" });
    }
    if (status.authenticated) return;
  } catch (error) {
    if (isRedirect(error)) throw error;
  }

  throw redirect({
    to: "/login",
    search: { redirect: redirectTarget(location) },
  });
}

export async function guardLoginRoute() {
  try {
    const status = await queryClient.ensureQueryData(authStatusQuery);
    if (!status.enabled) return;
    if (status.needsSetup) {
      throw redirect({ to: "/setup" });
    }
    if (status.authenticated) {
      throw redirect({ to: "/" });
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
  }
}

export async function guardSetupRoute() {
  try {
    const status = await queryClient.ensureQueryData(authStatusQuery);
    if (!status.enabled) return;
    if (status.needsSetup) return;
    if (status.authenticated) {
      throw redirect({ to: "/" });
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
  }

  throw redirect({ to: "/login", search: { redirect: undefined } });
}
