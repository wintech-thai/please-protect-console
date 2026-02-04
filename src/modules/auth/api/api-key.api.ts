import { client } from "@/lib/axios";
import { GetApiKeysParams, CreateApiKeyPayload, ApiKeyResponse } from "./types";

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp");

export const apiKeyApi = {
  getApiKeys: async (params: GetApiKeysParams = {}) => {
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 10,
      fullTextSearch: params.fullTextSearch || "",
      status: params.status || ""
    };
    const response = await client.post(`/api/ApiKey/org/${getOrgId()}/action/GetApiKeys`, payload);
    return response.data;
  },

  getApiKeysCount: async (params: GetApiKeysParams = {}) => {
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
      status: params.status || ""
    };
    const response = await client.post(`/api/ApiKey/org/${getOrgId()}/action/GetApiKeyCount`, payload);
    return response.data;
  },

  createApiKey: async (data: CreateApiKeyPayload): Promise<ApiKeyResponse> => {
    const payload = {
      keyName: data.keyName,
      keyDescription: data.description, 
      customRoleId: data.customRoleId || null,
      roles: data.roles || [] 
    };

    const response = await client.post(`/api/ApiKey/org/${getOrgId()}/action/AddApiKey`, payload);
    
    if (response && response.data) {
        return response.data;
    }
    return response as any;
  },

  enableApiKey: async (keyId: string) => {
    const response = await client.post(`/api/ApiKey/org/${getOrgId()}/action/EnableApiKeyById/${keyId}`);
    return response.data;
  },

  disableApiKey: async (keyId: string) => {
    const response = await client.post(`/api/ApiKey/org/${getOrgId()}/action/DisableApiKeyById/${keyId}`);
    return response.data;
  },

  deleteApiKey: async (keyId: string) => {
    const response = await client.delete(`/api/ApiKey/org/${getOrgId()}/action/DeleteApiKeyById/${keyId}`);
    return response.data;
  }
};