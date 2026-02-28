import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { workloadsApi, type Workload } from "../api/workloads.api";

export const workloadKeys = {
  all: ["workloads"] as const,
  list: () => [...workloadKeys.all, "list"] as const,
  namespaces: () => [...workloadKeys.all, "namespaces"] as const,
};

type WorkloadsOptions = Omit<UseQueryOptions<Workload[]>, "queryKey" | "queryFn">;
type NamespacesOptions = Omit<UseQueryOptions<string[]>, "queryKey" | "queryFn">;

export function useWorkloads(options?: WorkloadsOptions) {
  return useQuery({
    queryKey: workloadKeys.list(),
    queryFn: () => workloadsApi.getAllWorkloads(),
    ...options,
  });
}

export function useNamespaces(options?: NamespacesOptions) {
  return useQuery({
    queryKey: workloadKeys.namespaces(),
    queryFn: () => workloadsApi.getNamespaces(),
    ...options,
  });
}
