import { queryOptions, useMutation } from "@tanstack/react-query";

import * as playitApi from "@/api/playit";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export const playitStatusQuery = queryOptions({
  queryKey: queryKeys.session.playit.status,
  queryFn: playitApi.getPlayitStatus,
  refetchInterval: 3000,
});

export function usePlayitActionMutation(action: "start" | "stop" | "reset") {
  const mutationFn = {
    start: playitApi.startPlayit,
    stop: playitApi.stopPlayit,
    reset: playitApi.resetPlayit,
  }[action];

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.session.playit.status, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.playit.status });
    },
  });
}
