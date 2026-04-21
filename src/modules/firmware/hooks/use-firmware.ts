import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { firmwareApi, type UpgradeJob } from "../api/firmware.api";

export const firmwareKeys = {
  all: ["firmware"] as const,
  localVersion: () => [...firmwareKeys.all, "local-version"] as const,
  remoteVersion: () => [...firmwareKeys.all, "remote-version"] as const,
  history: () => [...firmwareKeys.all, "history"] as const,
};

type HistoryOptions = Omit<UseQueryOptions<UpgradeJob[]>, "queryKey" | "queryFn">;

export function useFirmwareLocalVersion() {
  return useQuery({
    queryKey: firmwareKeys.localVersion(),
    queryFn: firmwareApi.getLocalVersion,
  });
}

export function useFirmwareRemoteVersion() {
  return useQuery({
    queryKey: firmwareKeys.remoteVersion(),
    queryFn: firmwareApi.getRemoteVersion,
  });
}

export function useFirmwareHistory(options?: HistoryOptions) {
  return useQuery({
    queryKey: firmwareKeys.history(),
    queryFn: firmwareApi.getUpgradeHistory,
    refetchInterval: 15_000,
    ...options,
  });
}

export function useVersionUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromVersion, toVersion }: { fromVersion: string; toVersion: string }) =>
      firmwareApi.upgradeVersion(fromVersion, toVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firmwareKeys.history() });
    },
  });
}
