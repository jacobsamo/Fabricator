import { get, post, postWithOptions } from "@/api/client";
import { authStatusSchema, type AuthStatus } from "@/api/schemas";

export async function getAuthStatus() {
  return authStatusSchema.parse(await get<AuthStatus>("/api/auth/status", {}, { skipAuthRedirect: true }));
}

export function login(password: string) {
  return postWithOptions<{ authenticated?: boolean }>("/api/auth/login", { password }, { skipAuthRedirect: true });
}

export function setup(password: string) {
  return postWithOptions<{ authenticated?: boolean }>("/api/auth/setup", { password }, { skipAuthRedirect: true });
}

export function logout() {
  return post<{ authenticated?: boolean }>("/api/auth/logout");
}

export function changePassword(current: string, next: string) {
  return postWithOptions<{ ok?: boolean }>("/api/auth/change-password", { current, new: next }, { skipAuthRedirect: true });
}
