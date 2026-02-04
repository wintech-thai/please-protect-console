import { client } from "@/lib/axios";
import { GetUsersParams, GetCustomRolesParams } from "./types";

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp");

export const roleApi = {
  getRoles: async (params: GetUsersParams = {}) => {
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 100,
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/Role/org/${getOrgId()}/action/GetRoles`, payload);
    return response.data;
  },

  getCustomRoles: async (params: GetCustomRolesParams = {}) => {
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 100,
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
      level: params.level || ""
    };
    const response = await client.post(`/api/CustomRole/org/${getOrgId()}/action/GetCustomRoles`, payload);
    return response.data;
  },
};