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

  getCustomRoleCount: async (params: GetCustomRolesParams = {}) => {
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
      level: params.level || ""
    };
    const response = await client.post(`/api/CustomRole/org/${getOrgId()}/action/GetCustomRoleCount`, payload);
    return response.data;
  },

  getCustomRoleById: async (customRoleId: string) => {
    const response = await client.get(`/api/CustomRole/org/${getOrgId()}/action/GetCustomRoleById/${customRoleId}`);
    return response.data;
  },

  updateCustomRoleById: async (customRoleId: string, data: any) => {
    const response = await client.post(`/api/CustomRole/org/${getOrgId()}/action/UpdateCustomRoleById/${customRoleId}`, data);
    return response.data;
  },

  createCustomRole: async (data: any) => {
    const response = await client.post(`/api/CustomRole/org/${getOrgId()}/action/AddCustomRole`, data);
    return response.data;
  },

  deleteCustomRole: async (customRoleId: string) => {
    const response = await client.delete(`/api/CustomRole/org/${getOrgId()}/action/DeleteCustomRoleById/${customRoleId}`);
    return response.data;
  },

  getInitialUserRolePermissions: async () => {
    const response = await client.get(`/api/CustomRole/org/${getOrgId()}/action/GetInitialUserRolePermissions`);
    return response.data;
  }
};