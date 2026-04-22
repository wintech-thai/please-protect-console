import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

// Types

export interface VersionInfo {
  version: string;
}

export type UpgradeJobStatus = "Running" | "Done" | "Failed" | string;

export interface UpgradeJobParameter {
  name: string;
  value: string;
}

export interface UpgradeJob {
  id: string;
  orgId: string;
  status: UpgradeJobStatus;
  jobMessage: string;
  name: string;
  tags: string;
  description: string;
  type: string;
  progressPct: number | null;
  succeedCount: number;
  failedCount: number;
  configuration: string;
  createdDate: string;
  updatedDate: string;
  pickupDate: string;
  startDate: string;
  endDate: string;
  documentId: string | null;
  parameters: UpgradeJobParameter[];
}

// Helpers

export function getParamValue(job: UpgradeJob, name: string): string {
  return job.parameters.find((p) => p.name === name)?.value ?? "—";
}

// API

export const firmwareApi = {
  getLocalVersion: async (): Promise<string> => {
    const orgId = getOrgId();
    const { data } = await client.get<VersionInfo | string>(
      `/api/Application/org/${orgId}/action/GetLocalVersion`,
    );
    if (typeof data === "string") return data || "";
    return (data as VersionInfo)?.version ?? "";
  },

  getRemoteVersion: async (): Promise<string> => {
    const orgId = getOrgId();
    const { data } = await client.get<VersionInfo | string>(
      `/api/Application/org/${orgId}/action/GetRemoteVersion`,
    );
    if (typeof data === "string") return data || "";
    return (data as VersionInfo)?.version ?? "";
  },

  getUpgradeHistory: async (): Promise<UpgradeJob[]> => {
    const orgId = getOrgId();
    const { data } = await client.get<UpgradeJob[]>(
      `/api/Application/org/${orgId}/action/GetUpgradeHistory`,
    );
    return Array.isArray(data) ? data : [];
  },

  upgradeVersion: async (fromVersion: string, toVersion: string): Promise<void> => {
    const orgId = getOrgId();
    await client.post(`/api/Application/org/${orgId}/action/VersionUpgrade`, {
      FromVersion: fromVersion,
      ToVersion: toVersion,
    });
  },
};
