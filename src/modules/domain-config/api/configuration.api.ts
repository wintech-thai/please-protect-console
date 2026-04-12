import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("orgId") || "temp"
    : "temp";

// ─── Response types ───────────────────────────────────────────────────────────

export interface ConfigurationEntry {
  configId: string;
  orgId: string | null;
  configType: string;
  configValue: string;
  createdDate: string;
}

export interface ConfigurationResponse {
  status: string;
  description: string;
  configuration: ConfigurationEntry;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function getConfig(action: string): Promise<ConfigurationEntry> {
  const orgId = getOrgId();
  const res = await client.get<ConfigurationResponse>(
    `/api/Configuration/org/${orgId}/action/${action}`,
  );
  return res.data.configuration;
}

async function setConfig(
  action: string,
  value: string,
): Promise<ConfigurationEntry> {
  const orgId = getOrgId();
  const res = await client.post<ConfigurationResponse>(
    `/api/Configuration/org/${orgId}/action/${action}`,
    { ConfigValue: value },
  );
  return res.data.configuration;
}

// ─── Configuration API ────────────────────────────────────────────────────────

export const configurationApi = {
  /** GET current domain */
  getDomain(): Promise<ConfigurationEntry> {
    return getConfig("GetDomain");
  },

  /** GET current logo URL */
  getLogo(): Promise<ConfigurationEntry> {
    return getConfig("GetLogo");
  },

  /** GET current organisation short name */
  getOrgShortName(): Promise<ConfigurationEntry> {
    return getConfig("GetOrgShortName");
  },

  /** GET current organisation description */
  getOrgDescription(): Promise<ConfigurationEntry> {
    return getConfig("GetOrgDescription");
  },

  /** SET domain */
  setDomain(value: string): Promise<ConfigurationEntry> {
    return setConfig("SetDomain", value);
  },

  /** SET logo URL */
  setLogo(value: string): Promise<ConfigurationEntry> {
    return setConfig("SetLogo", value);
  },

  /** SET organisation short name */
  setOrgShortName(value: string): Promise<ConfigurationEntry> {
    return setConfig("SetOrgShortName", value);
  },

  /** SET organisation description */
  setOrgDescription(value: string): Promise<ConfigurationEntry> {
    return setConfig("SetOrgDescription", value);
  },
};
