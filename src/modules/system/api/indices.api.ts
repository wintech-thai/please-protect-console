import { client } from "@/lib/axios";

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default");

export interface FetchIndicesParams {
  offset?: number;
  limit?: number;
}

export interface IndexItem {
  indexName: string;
  health: string;
  status: string;
  docCount: number;
  storeSizeBytes: number;
  storeSizeHuman: string;
  ilmPhase: string;
  creationDate: string;
  primaryShards: number;
  replicas: number;
}

export interface GetIndicesResponse {
  offset: number;
  limit: number;
  total: number;
  data: IndexItem[];
}

export interface IlmPolicyData {
  warmDayCount: number;
  coldDayCount: number;
  deleteDayCount: number;
}

export const indicesApi = {
  getIndices: async (params: FetchIndicesParams = {}) => {
    const payload = {
      Offset: params.offset || 0,
      Limit: params.limit || 10,
    };
    
    const response = await client.post<GetIndicesResponse>(
      `/api/Es/org/${getOrgId()}/action/GetIndices`, 
      payload
    );
    
    return response.data;
  },

  deleteIndex: async (indexName: string) => {
    const response = await client.delete(`/api/Es/org/${getOrgId()}/action/DeleteIndex/${indexName}`);
    return response.data;
  },

  getIlmPolicy: async () => {
    const response = await client.get(`/api/Es/org/${getOrgId()}/action/GetIndexPolicy`);
    return response.data; 
  },

  updateIlmPolicy: async (data: IlmPolicyData) => {
    const response = await client.post(`/api/Es/org/${getOrgId()}/action/UpdateIndexPolicy`, data);
    return response.data;
  },

  getIndexStat: async (indexName: string) => {
    const response = await client.get(`/api/Es/org/${getOrgId()}/action/GetIndexStat/${indexName}`);
    return response.data;
  },

  getIndexSetting: async (indexName: string) => {
    const response = await client.get(`/api/Es/org/${getOrgId()}/action/GetIndexSetting/${indexName}`);
    return response.data;
  },
};