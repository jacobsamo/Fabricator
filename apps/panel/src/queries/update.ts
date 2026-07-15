import { queryOptions, useMutation } from "@tanstack/react-query";

import * as serversApi from "@/api/servers";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const UPDATE_POLL_INTERVAL_ACTIVE = 4_000;
export const UPDATE_POLL_INTERVAL_IDLE = 15 * 60 * 1_000;

export const updateStatusQuery = queryOptions({
  queryKey: queryKeys.session.update.status,
  queryFn: serversApi.getUpdateStatus,
  refetchInterval: (query) =>
    query.state.data?.inProgress ? UPDATE_POLL_INTERVAL_ACTIVE : UPDATE_POLL_INTERVAL_IDLE,
});

export function useTriggerUpdateMutation() {
  return useMutation({
    mutationFn: serversApi.triggerUpdate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.update.status });
    },
  });
}
