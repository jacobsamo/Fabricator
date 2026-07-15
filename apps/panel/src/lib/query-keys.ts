export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    status: ["auth", "status"] as const,
  },
  session: {
    all: ["session"] as const,
    servers: ["session", "servers"] as const,
    server: (serverId: string) => ["session", "server", serverId] as const,
  },
};

export function isSessionQueryKey(queryKey: readonly unknown[]) {
  return queryKey[0] === queryKeys.session.all[0];
}
