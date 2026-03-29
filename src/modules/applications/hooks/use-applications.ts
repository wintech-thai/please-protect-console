import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { applicationsApi, type ApplicationItem } from "../api/applications.api";

export const applicationKeys = {
  all: ["applications"] as const,
  list: () => [...applicationKeys.all, "list"] as const,
  config: (appName: string) => [...applicationKeys.all, "config", appName] as const,
  defaultConfig: (appName: string) => [...applicationKeys.config(appName), "default"] as const,
  currentCustomConfig: (appName: string) => [...applicationKeys.config(appName), "current-custom"] as const,
  draftCustomConfig: (appName: string) => [...applicationKeys.config(appName), "draft-custom"] as const,
};

type ApplicationsOptions = Omit<UseQueryOptions<ApplicationItem[]>, "queryKey" | "queryFn">;

export function useApplications(options?: ApplicationsOptions) {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: applicationsApi.getApplications,
    ...options,
  });
}

type ApplicationConfigOptions = Omit<UseQueryOptions<string>, "queryKey" | "queryFn">;

export function useCurrentAppDefaultConfig(appName: string, options?: ApplicationConfigOptions) {
  return useQuery({
    queryKey: applicationKeys.defaultConfig(appName),
    queryFn: () => applicationsApi.getCurrentAppDefaultConfig(appName),
    enabled: !!appName,
    ...options,
  });
}

export function useCurrentAppCustomConfig(appName: string, options?: ApplicationConfigOptions) {
  return useQuery({
    queryKey: applicationKeys.currentCustomConfig(appName),
    queryFn: () => applicationsApi.getCurrentAppCustomConfig(appName),
    enabled: !!appName,
    ...options,
  });
}

export function useDraftAppCustomConfig(appName: string, options?: ApplicationConfigOptions) {
  return useQuery({
    queryKey: applicationKeys.draftCustomConfig(appName),
    queryFn: () => applicationsApi.getDraftAppCustomConfig(appName),
    enabled: !!appName,
    ...options,
  });
}

export function useSaveDraftAppCustomConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appName, yamlContent }: { appName: string; yamlContent: string }) =>
      applicationsApi.saveDraftAppCustomConfig(appName, yamlContent),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.draftCustomConfig(variables.appName),
      });
    },
  });
}

export function useMergeDraftAppCustomConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appName: string) => applicationsApi.mergeDraftAppCustomConfig(appName),
    onSuccess: (_data, appName) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.currentCustomConfig(appName) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.draftCustomConfig(appName) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.defaultConfig(appName) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.list() });
    },
  });
}
