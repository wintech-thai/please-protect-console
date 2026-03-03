import { client } from "@/lib/axios";

export interface GetIocParams {
  FullTextSearch?: string;
  FromDate?: string;
  ToDate?: string;
  [key: string]: any; 
}

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp");

export const iocApi = {
  getIocs: async (params: GetIocParams = {}) => {
    const payload = {
      FullTextSearch: params.FullTextSearch || "",
      FromDate: params.FromDate,
      ToDate: params.ToDate,
      ...params,
    };
    const response = await client.post(`/api/IoC/org/${getOrgId()}/action/GetIoCs`, payload);
    return response.data;
  },

  getIocById: async (id: string) => {
    const response = await client.get(`/api/IoC/org/${getOrgId()}/action/GetIoCById/${id}`);
    return response.data;
  },

  deleteIocById: async (id: string) => {
    const response = await client.delete(`/api/IoC/org/${getOrgId()}/action/DeleteIoCById/${id}`);
    return response.data;
  }
};