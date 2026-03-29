import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { applicationsApi, type ApplicationItem } from "../api/applications.api";

export const applicationKeys = {
  all: ["applications"] as const,
  list: () => [...applicationKeys.all, "list"] as const,
};

type ApplicationsOptions = Omit<UseQueryOptions<ApplicationItem[]>, "queryKey" | "queryFn">;

export function useApplications(options?: ApplicationsOptions) {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: applicationsApi.getApplications,
    ...options,
  });
}
