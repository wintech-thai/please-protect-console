import { client } from "@/lib/axios";

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

const getOrgId = () => typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";

async function getConfig(action: string): Promise<ConfigurationEntry> {
  const orgId = getOrgId();
  const res = await client.get<ConfigurationResponse>(`/api/Configuration/org/${orgId}/action/${action}`);
  return res.data.configuration;
}

async function setConfig(action: string, value: string): Promise<ConfigurationEntry> {
  const orgId = getOrgId();
  const res = await client.post<ConfigurationResponse>(`/api/Configuration/org/${orgId}/action/${action}`, { ConfigValue: value });
  return res.data.configuration;
}

export const cloudConnectConfigApi = {
  getCloudUrl: () => getConfig("GetCloudUrl"),
  setCloudUrl: (value: string) => setConfig("SetCloudUrl", value),
  
  getCloudConnectKey: () => getConfig("GetCloudConnectKey"),
  setCloudConnectKey: (value: string) => setConfig("SetCloudConnectKey", value),
  
  getCloudConnectFlag: () => getConfig("GetCloudConnectFlag"),
  setCloudConnectFlag: (value: string) => setConfig("SetCloudConnectFlag", value),
};
