import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  workloadDetailApi,
  type ResourceLimits,
  type WorkloadInfo,
  type PodDetail,
  type RevisionInfo,
  type WorkloadMetrics,
} from "../api/workload-detail.api";
import type { WorkloadType } from "../api/workloads.api";

export const workloadDetailKeys = {
  all: ["workloadDetail"] as const,
  info: (ns: string, name: string, type: WorkloadType) =>
    [...workloadDetailKeys.all, "info", ns, name, type] as const,
  pods: (ns: string, name: string, type: WorkloadType) =>
    [...workloadDetailKeys.all, "pods", ns, name, type] as const,
  revisions: (ns: string, name: string, type: WorkloadType) =>
    [...workloadDetailKeys.all, "revisions", ns, name, type] as const,
  resourceLimits: (ns: string, name: string, type: WorkloadType) =>
    [...workloadDetailKeys.all, "resourceLimits", ns, name, type] as const,
  metrics: (ns: string, name: string, duration: number, step: number, start?: number, end?: number) =>
    [...workloadDetailKeys.all, "metrics", ns, name, duration, step, start, end] as const,
};

type InfoOptions = Omit<UseQueryOptions<WorkloadInfo>, "queryKey" | "queryFn">;
type PodsOptions = Omit<UseQueryOptions<PodDetail[]>, "queryKey" | "queryFn">;
type RevisionsOptions = Omit<UseQueryOptions<RevisionInfo[]>, "queryKey" | "queryFn">;
type ResourceLimitsOptions = Omit<UseQueryOptions<ResourceLimits>, "queryKey" | "queryFn">;
type MetricsOptions = Omit<UseQueryOptions<WorkloadMetrics>, "queryKey" | "queryFn">;

export function useWorkloadInfo(
  namespace: string,
  name: string,
  type: WorkloadType,
  options?: InfoOptions,
) {
  return useQuery({
    queryKey: workloadDetailKeys.info(namespace, name, type),
    queryFn: () => workloadDetailApi.getWorkloadInfo(namespace, name, type),
    ...options,
  });
}

export function useWorkloadPods(
  namespace: string,
  name: string,
  type: WorkloadType,
  options?: PodsOptions,
) {
  return useQuery({
    queryKey: workloadDetailKeys.pods(namespace, name, type),
    queryFn: () => workloadDetailApi.getPods(namespace, name, type),
    ...options,
  });
}

export function useWorkloadRevisions(
  namespace: string,
  name: string,
  type: WorkloadType,
  options?: RevisionsOptions,
) {
  return useQuery({
    queryKey: workloadDetailKeys.revisions(namespace, name, type),
    queryFn: () => workloadDetailApi.getRevisions(namespace, name, type),
    ...options,
  });
}

export function useResourceLimits(
  namespace: string,
  name: string,
  type: WorkloadType,
  options?: ResourceLimitsOptions,
) {
  return useQuery<ResourceLimits>({
    queryKey: workloadDetailKeys.resourceLimits(namespace, name, type),
    queryFn: () => workloadDetailApi.getResourceLimits(namespace, name, type),
    ...options,
  });
}

export function useWorkloadMetrics(
  namespace: string,
  name: string,
  durationSeconds: number,
  step: number,
  start?: number,
  end?: number,
  options?: MetricsOptions,
) {
  return useQuery({
    queryKey: workloadDetailKeys.metrics(namespace, name, durationSeconds, step, start, end),
    queryFn: () => workloadDetailApi.getMetrics(namespace, name, durationSeconds, step, start, end),
    ...options,
  });
}
