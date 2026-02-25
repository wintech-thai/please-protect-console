import { client } from "@/lib/axios";
import type { WorkloadType } from "./workloads.api";

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";

const KUBE_BASE = (orgId: string) => `/api/Proxy/org/${orgId}/action/Kube`;
const PROM_BASE = (orgId: string) => `/api/Proxy/org/${orgId}/action/Prometheus/api/v1`;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PodDetail {
  name: string;
  namespace: string;
  phase: string;
  ready: number;
  total: number;
  restarts: number;
  nodeName: string;
  createdAt: string; // ISO string
  containers: string[];
}

export interface ContainerInfo {
  name: string;
  image: string;
}

export interface ReplicaInfo {
  desired: number;
  ready: number;
  available: number;
  unavailable: number;
}

export interface WorkloadInfo {
  labels: Record<string, string>;
  createdAt: string;
  containers: ContainerInfo[];
  replicas?: ReplicaInfo;       // Deployment / StatefulSet / DaemonSet
}

export interface RevisionInfo {
  revision: number;
  name: string;           // ReplicaSet / ControllerRevision name
  createdAt: string;
  podsRunning: number;
  podsTotal: number;
  images: string[];       // container images at this revision
  isActive: boolean;      // replicas > 0
}

export interface MetricPoint {
  time: number; // ms timestamp
  value: number;
}

export interface WorkloadMetrics {
  cpu: MetricPoint[];    // cores (raw seconds/second)
  memory: MetricPoint[]; // bytes
  disk: MetricPoint[];   // bytes (may be empty if unavailable)
}

// ──────────────────────────────────────────────
// Raw Kube response helpers
// ──────────────────────────────────────────────

interface RawContainer {
  name: string;
  image: string;
}

interface RawWorkloadMeta {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  creationTimestamp?: string;
}

// Used only as a type hint — individual resource endpoints may be blocked
interface RawDeployment {
  metadata: RawWorkloadMeta;
  spec: { replicas?: number; template: { spec: { containers?: RawContainer[] } } };
  status: { replicas?: number; readyReplicas?: number; availableReplicas?: number; unavailableReplicas?: number };
}

interface RawStatefulSet {
  metadata: RawWorkloadMeta;
  spec: { replicas?: number; template: { spec: { containers?: RawContainer[] } } };
  status: { replicas?: number; readyReplicas?: number };
}

interface RawDaemonSet {
  metadata: RawWorkloadMeta;
  spec: { template: { spec: { containers?: RawContainer[] } } };
  status: { desiredNumberScheduled?: number; numberReady?: number; numberAvailable?: number; numberUnavailable?: number };
}

interface RawPod {
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    creationTimestamp: string;
  };
  spec: {
    nodeName?: string;
    containers?: Array<{ name: string; image: string }>;
  };
  status: {
    phase?: string;
    containerStatuses?: Array<{ name: string; ready: boolean; restartCount: number }>;
  };
}

interface KubeList<T> {
  items: T[];
}

interface RawReplicaSet {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{ kind: string; name: string }>;
  };
  spec: {
    replicas?: number;
    template?: { spec?: { containers?: RawContainer[] } };
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
  };
}

interface RawControllerRevision {
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{ kind: string; name: string }>;
  };
  revision: number;
  // data field contains the patch; extracting images from it is unreliable so we skip
}

// ──────────────────────────────────────────────
// Prometheus helpers
// ──────────────────────────────────────────────

interface PromRangeResponse {
  status: string;
  data: {
    resultType: "matrix";
    result: Array<{
      metric: Record<string, string>;
      values: [number, string][]; // [unix_seconds, value_string]
    }>;
  };
}

async function queryRange(
  query: string,
  durationSeconds = 3600,
  step?: number,
  absStart?: number,
  absEnd?: number,
): Promise<MetricPoint[]> {
  const orgId = getOrgId();
  const end = absEnd ?? Math.floor(Date.now() / 1000);
  const start = absStart ?? (end - durationSeconds);
  const duration = end - start;
  const autoStep = step ?? (duration <= 300 ? 15 : duration <= 3600 ? 60 : duration <= 21600 ? 180 : duration <= 86400 ? 600 : 1200);
  try {
    const res = await client.get<PromRangeResponse>(`${PROM_BASE(orgId)}/query_range`, {
      params: { query, start, end, step: autoStep },
    });
    if (res.data?.status !== "success") return [];
    const result = res.data.data?.result ?? [];
    // Sum across all series if multiple pods
    if (result.length === 0) return [];
    // Build a time-keyed map and sum
    const map = new Map<number, number>();
    for (const series of result) {
      for (const [ts, val] of series.values) {
        const v = parseFloat(val);
        if (!isNaN(v)) {
          map.set(ts, (map.get(ts) ?? 0) + v);
        }
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, value]) => ({ time: ts * 1000, value }));
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────

export const workloadDetailApi = {
  /**
   * Derive workload info (labels, containers+images, replicas) from the pod list.
   * This avoids calling individual resource endpoints which may be blocked.
   * Falls back to individual resource endpoint for desired replica count.
   */
  getWorkloadInfo: async (
    namespace: string,
    workloadName: string,
    workloadType: WorkloadType
  ): Promise<WorkloadInfo> => {
    const orgId = getOrgId();
    const podsUrl = `${KUBE_BASE(orgId)}/api/v1/namespaces/${namespace}/pods`;
    const res = await client.get<KubeList<RawPod>>(podsUrl);
    const allPods = res.data?.items ?? [];

    const matchingPods =
      workloadType === "Pod"
        ? allPods.filter((p) => p.metadata.name === workloadName)
        : allPods.filter((p) => p.metadata.name.startsWith(workloadName));

    const refPod = matchingPods[0];

    const labels = refPod?.metadata.labels ?? {};
    const createdAt = refPod?.metadata.creationTimestamp ?? "";
    const containers: ContainerInfo[] = (refPod?.spec.containers ?? []).map((c) => ({
      name: c.name,
      image: c.image ?? "",
    }));

    // Derive replicas from pod counts
    const total = matchingPods.length;
    const ready = matchingPods.filter((p) => {
      const cs = p.status.containerStatuses ?? [];
      return cs.length > 0 && cs.every((c) => c.ready);
    }).length;

    let desiredReplicas = total;

    // Try to get the spec.replicas from the individual resource (best-effort, may be blocked)
    if (workloadType === "Deployment") {
      try {
        const dr = await client.get<RawDeployment>(
          `${KUBE_BASE(orgId)}/apis/apps/v1/namespaces/${namespace}/deployments/${workloadName}`
        );
        desiredReplicas = dr.data?.spec?.replicas ?? total;
      } catch { /* ignore */ }
    } else if (workloadType === "StatefulSet") {
      try {
        const sr = await client.get<RawStatefulSet>(
          `${KUBE_BASE(orgId)}/apis/apps/v1/namespaces/${namespace}/statefulsets/${workloadName}`
        );
        desiredReplicas = sr.data?.spec?.replicas ?? total;
      } catch { /* ignore */ }
    } else if (workloadType === "DaemonSet") {
      try {
        const dr = await client.get<RawDaemonSet>(
          `${KUBE_BASE(orgId)}/apis/apps/v1/namespaces/${namespace}/daemonsets/${workloadName}`
        );
        desiredReplicas = dr.data?.status?.desiredNumberScheduled ?? total;
      } catch { /* ignore */ }
    }

    const replicas: WorkloadInfo["replicas"] =
      workloadType !== "Pod"
        ? {
            desired: desiredReplicas,
            ready,
            available: ready,
            unavailable: Math.max(0, desiredReplicas - ready),
          }
        : undefined;

    return { labels, createdAt, containers, replicas };
  },

  /**
   * Fetch revision history.
   * - Deployment  → ReplicaSets (filtered by ownerReference)
   * - StatefulSet / DaemonSet → ControllerRevisions
   * - Pod → [] (no revision concept)
   */
  getRevisions: async (
    namespace: string,
    workloadName: string,
    workloadType: WorkloadType
  ): Promise<RevisionInfo[]> => {
    const orgId = getOrgId();
    const base = KUBE_BASE(orgId);

    if (workloadType === "Deployment") {
      try {
        const res = await client.get<KubeList<RawReplicaSet>>(
          `${base}/apis/apps/v1/namespaces/${namespace}/replicasets`
        );
        const rsList = res.data?.items ?? [];
        const owned = rsList.filter((rs) =>
          rs.metadata.ownerReferences?.some(
            (ref) => ref.kind === "Deployment" && ref.name === workloadName
          )
        );
        return owned
          .map((rs): RevisionInfo => {
            const rev = parseInt(
              rs.metadata.annotations?.["deployment.kubernetes.io/revision"] ?? "0",
              10
            );
            const desired = rs.spec.replicas ?? 0;
            const running = rs.status.readyReplicas ?? 0;
            const images = (rs.spec.template?.spec?.containers ?? []).map((c) => c.image);
            return {
              revision: rev,
              name: rs.metadata.name,
              createdAt: rs.metadata.creationTimestamp,
              podsRunning: running,
              podsTotal: desired,
              images,
              isActive: desired > 0,
            };
          })
          .sort((a, b) => b.revision - a.revision);
      } catch {
        return [];
      }
    }

    if (workloadType === "StatefulSet" || workloadType === "DaemonSet") {
      try {
        const res = await client.get<KubeList<RawControllerRevision>>(
          `${base}/apis/apps/v1/namespaces/${namespace}/controllerrevisions`
        );
        const crList = res.data?.items ?? [];
        const ownerKind = workloadType === "StatefulSet" ? "StatefulSet" : "DaemonSet";
        const owned = crList.filter((cr) =>
          cr.metadata.ownerReferences?.some(
            (ref) => ref.kind === ownerKind && ref.name === workloadName
          )
        );
        return owned
          .map((cr): RevisionInfo => ({
            revision: cr.revision,
            name: cr.metadata.name,
            createdAt: cr.metadata.creationTimestamp,
            podsRunning: 0,
            podsTotal: 0,
            images: [],
            isActive: false,
          }))
          .sort((a, b) => b.revision - a.revision);
      } catch {
        return [];
      }
    }

    return [];
  },

  /**
   * For Deployment/StatefulSet/DaemonSet: fetch all pods in namespace and filter by name prefix.
   * For Pod: exact match.
   */
  getPods: async (
    namespace: string,
    workloadName: string,
    workloadType: WorkloadType
  ): Promise<PodDetail[]> => {
    const orgId = getOrgId();
    const url = `${KUBE_BASE(orgId)}/api/v1/namespaces/${namespace}/pods`;
    const res = await client.get<KubeList<RawPod>>(url);
    const items = res.data?.items ?? [];

    const filtered =
      workloadType === "Pod"
        ? items.filter((p) => p.metadata.name === workloadName)
        : items.filter((p) => p.metadata.name.startsWith(workloadName));

    return filtered.map((p): PodDetail => {
      const cs = p.status.containerStatuses ?? [];
      return {
        name: p.metadata.name,
        namespace: p.metadata.namespace,
        phase: p.status.phase ?? "Unknown",
        ready: cs.filter((c) => c.ready).length,
        total: cs.length || (p.spec.containers?.length ?? 0),
        restarts: cs.reduce((sum, c) => sum + (c.restartCount ?? 0), 0),
        nodeName: p.spec.nodeName ?? "—",
        createdAt: p.metadata.creationTimestamp ?? "",
        containers: (p.spec.containers ?? []).map((c) => c.name),
      };
    });
  },

  /**
   * Fetch CPU, Memory, and Disk metrics from Prometheus for a workload.
   * Uses pod name prefix matching in PromQL.
   */
  getMetrics: async (
    namespace: string,
    workloadName: string,
    durationSeconds = 3600,
    step?: number,
    absStart?: number,
    absEnd?: number,
  ): Promise<WorkloadMetrics> => {
    const podRegex = `${workloadName}.*`;

    const [cpu, memory, disk] = await Promise.all([
      queryRange(
        `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}",pod=~"${podRegex}",container!="",container!="POD"}[5m]))`,
        durationSeconds, step, absStart, absEnd
      ),
      queryRange(
        `sum(container_memory_working_set_bytes{namespace="${namespace}",pod=~"${podRegex}",container!="",container!="POD"})`,
        durationSeconds, step, absStart, absEnd
      ),
      queryRange(
        `sum(container_fs_usage_bytes{namespace="${namespace}",pod=~"${podRegex}",container!="",container!="POD"})`,
        durationSeconds, step, absStart, absEnd
      ),
    ]);

    return { cpu, memory, disk };
  },
};
