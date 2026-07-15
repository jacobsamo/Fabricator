import type { AuthStatus } from "@/api/schemas";
import { queryClient } from "@/lib/query-client";
import { isSessionQueryKey, queryKeys } from "@/lib/query-keys";

export const authenticatedStatus: AuthStatus = {
  authenticated: true,
  enabled: true,
  needsSetup: false,
};

export const unauthenticatedStatus: AuthStatus = {
  authenticated: false,
  enabled: true,
  needsSetup: false,
};

export function setAuthenticatedSession() {
  queryClient.setQueryData(queryKeys.auth.status, authenticatedStatus);
}

export async function clearAuthenticatedSession(status: AuthStatus = unauthenticatedStatus) {
  await queryClient.cancelQueries({ predicate: (query) => isSessionQueryKey(query.queryKey) });
  queryClient.removeQueries({ predicate: (query) => isSessionQueryKey(query.queryKey) });
  queryClient.getMutationCache().clear();
  queryClient.setQueryData(queryKeys.auth.status, status);
}
