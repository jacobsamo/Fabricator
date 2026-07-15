import { queryOptions, useMutation } from "@tanstack/react-query";

import * as authApi from "@/api/auth";
import { clearAuthenticatedSession, setAuthenticatedSession, unauthenticatedStatus } from "@/lib/auth-session";
import { queryKeys } from "@/lib/query-keys";

export const AUTH_STATUS_QUERY_KEY = queryKeys.auth.status;

export const authStatusQuery = queryOptions({
  queryKey: AUTH_STATUS_QUERY_KEY,
  queryFn: authApi.getAuthStatus,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});

export function useLoginMutation() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: setAuthenticatedSession,
  });
}

export function useSetupMutation() {
  return useMutation({
    mutationFn: authApi.setup,
    onSuccess: setAuthenticatedSession,
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearAuthenticatedSession(unauthenticatedStatus),
  });
}
