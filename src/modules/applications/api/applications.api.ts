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

export interface ApplicationActionResponse {
  status: string;
  description: string;
}

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

const isHttp415 = (error: unknown) => {
  const maybeAxiosError = error as { response?: { status?: number } };
  return maybeAxiosError?.response?.status === 415;
};

export const applicationsApi = {
  getApplications: async (): Promise<ApplicationItem[]> => {
    const orgId = getOrgId();
    const { data } = await client.get<ApplicationItem[]>(
      `/api/Application/org/${orgId}/action/GetApplications`,
    );
    return Array.isArray(data) ? data : [];
  },

  getCurrentAppDefaultConfig: async (appName: string): Promise<string> => {
    const orgId = getOrgId();
    const { data } = await client.get<string>(
      `/api/Application/org/${orgId}/action/GetCurrentAppDefaultConfig/${encodeURIComponent(appName)}`,
      {
        transformResponse: [(raw) => raw],
      },
    );
    return typeof data === "string" ? data : "";
  },

  getCurrentAppCustomConfig: async (appName: string): Promise<string> => {
    const orgId = getOrgId();
    const { data } = await client.get<string>(
      `/api/Application/org/${orgId}/action/GetCurrentAppCustomConfig/${encodeURIComponent(appName)}`,
      {
        transformResponse: [(raw) => raw],
      },
    );
    return typeof data === "string" ? data : "";
  },

  getDraftAppCustomConfig: async (appName: string): Promise<string> => {
    const orgId = getOrgId();
    const { data } = await client.get<string>(
      `/api/Application/org/${orgId}/action/GetDraftAppCustomConfig/${encodeURIComponent(appName)}`,
      {
        transformResponse: [(raw) => raw],
      },
    );
    return typeof data === "string" ? data : "";
  },

  saveDraftAppCustomConfig: async (
    appName: string,
    yamlContent: string,
  ): Promise<ApplicationActionResponse> => {
    const orgId = getOrgId();
    const endpoint = `/api/Application/org/${orgId}/action/SaveDraftAppCustomConfig/${encodeURIComponent(appName)}`;

    try {
      const { data } = await client.post<ApplicationActionResponse>(endpoint, yamlContent, {
        headers: {
          "Content-Type": "application/x-yaml",
          Accept: "application/json",
        },
      });
      return data;
    } catch (error) {
      if (!isHttp415(error)) throw error;
    }

    try {
      const { data } = await client.post<ApplicationActionResponse>(endpoint, yamlContent, {
        headers: {
          "Content-Type": "text/yaml",
          Accept: "application/json",
        },
      });
      return data;
    } catch (error) {
      if (!isHttp415(error)) throw error;
    }

    // Some backends bind raw string body only when sent as JSON string payload.
    const { data } = await client.post<ApplicationActionResponse>(endpoint, JSON.stringify(yamlContent), {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return data;
  },

  mergeDraftAppCustomConfig: async (appName: string): Promise<ApplicationActionResponse> => {
    const orgId = getOrgId();
    const { data } = await client.post<ApplicationActionResponse>(
      `/api/Application/org/${orgId}/action/MergeDraftAppCustomConfig/${encodeURIComponent(appName)}`,
      {},
    );
    return data;
  },
};
