import { client } from "@/lib/axios";

export interface ApplicationItem {
  appId: string | null;
  orgId: string;
  appName: string;
  repoUrl: string;
  namespace: string;
  path: string;
  branch: string;
  directory: string;
  content: string | null;
}

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

export const applicationsApi = {
  getApplications: async (): Promise<ApplicationItem[]> => {
    const orgId = getOrgId();
    const { data } = await client.get<ApplicationItem[]>(
      `/api/Application/org/${orgId}/action/GetApplications`,
    );
    return Array.isArray(data) ? data : [];
  },
};
