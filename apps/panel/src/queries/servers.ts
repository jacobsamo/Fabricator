import { queryOptions } from "@tanstack/react-query";

import * as serversApi from "@/api/servers";
import { queryKeys } from "@/lib/query-keys";

export const serversQuery = queryOptions({
  queryKey: queryKeys.session.servers,
  queryFn: serversApi.getServers,
});

export function serverQuery(serverId: string) {
  return queryOptions({
    queryKey: queryKeys.session.server(serverId),
    queryFn: () => serversApi.getServer(serverId),
    refetchInterval: 2500,
  });
}
