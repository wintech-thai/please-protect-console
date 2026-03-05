import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";

// ──────────────────────────────────────────────
// Raw Kubernetes API response types
// ──────────────────────────────────────────────

interface KubeMeta {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
}

interface DeploymentItem {
  metadata: KubeMeta;
  spec: { replicas?: number };
  status: {
    replicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    conditions?: Array<{ type: string; status: string }>;
  };
}

interface StatefulSetItem {
  metadata: KubeMeta;
  spec: { replicas?: number };
  status: {
    replicas?: number;
    readyReplicas?: number;
    conditions?: Array<{ type: string; status: string }>;
  };
}

interface DaemonSetItem {
  metadata: KubeMeta;
  spec: Record<string, unknown>;
  status: {
    desiredNumberScheduled?: number;
    numberReady?: number;
    numberAvailable?: number;
    conditions?: Array<{ type: string; status: string }>;
  };
}

interface PodItem {
  metadata: KubeMeta;
  spec: Record<string, unknown>;
  status: {
    phase?: string; // Pending | Running | Succeeded | Failed | Unknown
    containerStatuses?: Array<{ ready: boolean; name: string }>;
    conditions?: Array<{ type: string; status: string }>;
  };
}

interface NamespaceItem {
  metadata: KubeMeta;
  status: { phase: string };
}

interface KubeList<T> {
  items: T[];
}

// ──────────────────────────────────────────────
// Unified Workload type
// ──────────────────────────────────────────────

export type WorkloadType = "Deployment" | "StatefulSet" | "DaemonSet" | "Pod";

export type WorkloadStatus = "OK" | "Warning" | "Error" | "Unknown";

export interface Workload {
  name: string;
  namespace: string;
  type: WorkloadType;
  status: WorkloadStatus;
  podsReady: number;
  podsDesired: number;
  createdAt: string;       // ISO timestamp from metadata.creationTimestamp
  podPhase?: string;       // Pod-only: raw phase (Running, Succeeded, Failed, etc.)
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function deploymentStatus(item: DeploymentItem): WorkloadStatus {
  const desired = item.spec.replicas ?? 1;
  const ready = item.status.readyReplicas ?? 0;
  if (desired === 0) return "OK";
  if (ready >= desired) return "OK";
  if (ready > 0) return "Warning";
  return "Error";
}

function statefulSetStatus(item: StatefulSetItem): WorkloadStatus {
  const desired = item.spec.replicas ?? 1;
  const ready = item.status.readyReplicas ?? 0;
  if (desired === 0) return "OK";
  if (ready >= desired) return "OK";
  if (ready > 0) return "Warning";
  return "Error";
}

function daemonSetStatus(item: DaemonSetItem): WorkloadStatus {
  const desired = item.status.desiredNumberScheduled ?? 0;
  const ready = item.status.numberReady ?? 0;
  if (desired === 0) return "OK";
  if (ready >= desired) return "OK";
  if (ready > 0) return "Warning";
  return "Error";
}

function podStatus(item: PodItem): WorkloadStatus {
  const phase = item.status.phase;
  if (phase === "Running") {
    const cs = item.status.containerStatuses ?? [];
    const allReady = cs.length > 0 && cs.every((c) => c.ready);
    return allReady ? "OK" : "Warning";
  }
  if (phase === "Succeeded") return "OK";
  if (phase === "Failed") return "Error";
  if (phase === "Pending") return "Warning";
  return "Unknown";
}

// ──────────────────────────────────────────────
// API
// ──────────────────────────────────────────────

async function fetchList<T>(path: string): Promise<T[]> {
  const orgId = getOrgId();
  const url = `api/Proxy/org/${orgId}/action/Kube/${path}`;
  const res = await client.get<KubeList<T>>(url);
  return res.data?.items ?? [];
}

export const workloadsApi = {
  /** Fetch all namespace names */
  getNamespaces: async (): Promise<string[]> => {
    const items = await fetchList<NamespaceItem>("api/v1/namespaces");
    return items.map((n) => n.metadata.name).sort();
  },

  /** Fetch all workloads (Deployments + StatefulSets + DaemonSets + Pods) */
  getAllWorkloads: async (): Promise<Workload[]> => {
    const [deployments, statefulsets, daemonsets, pods] = await Promise.all([
      fetchList<DeploymentItem>("apis/apps/v1/deployments"),
      fetchList<StatefulSetItem>("apis/apps/v1/statefulsets"),
      fetchList<DaemonSetItem>("apis/apps/v1/daemonsets"),
      fetchList<PodItem>("api/v1/pods"),
    ]);

    const result: Workload[] = [
      ...deployments.map(
        (d): Workload => ({
          name: d.metadata.name,
          namespace: d.metadata.namespace,
          type: "Deployment",
          status: deploymentStatus(d),
          podsReady: d.status.readyReplicas ?? 0,
          podsDesired: d.spec.replicas ?? 1,
          createdAt: d.metadata.creationTimestamp ?? "",
        })
      ),
      ...statefulsets.map(
        (s): Workload => ({
          name: s.metadata.name,
          namespace: s.metadata.namespace,
          type: "StatefulSet",
          status: statefulSetStatus(s),
          podsReady: s.status.readyReplicas ?? 0,
          podsDesired: s.spec.replicas ?? 1,
          createdAt: s.metadata.creationTimestamp ?? "",
        })
      ),
      ...daemonsets.map(
        (d): Workload => ({
          name: d.metadata.name,
          namespace: d.metadata.namespace,
          type: "DaemonSet",
          status: daemonSetStatus(d),
          podsReady: d.status.numberReady ?? 0,
          podsDesired: d.status.desiredNumberScheduled ?? 0,
          createdAt: d.metadata.creationTimestamp ?? "",
        })
      ),
      ...pods.map(
        (p): Workload => ({
          name: p.metadata.name,
          namespace: p.metadata.namespace,
          type: "Pod",
          status: podStatus(p),
          podsReady: (p.status.containerStatuses ?? []).filter((c) => c.ready).length,
          podsDesired: (p.status.containerStatuses ?? []).length,
          createdAt: p.metadata.creationTimestamp ?? "",
          podPhase: p.status.phase ?? "Unknown",
        })
      ),
    ];

    return result.sort((a, b) => a.name.localeCompare(b.name));
  },
};
