import { client } from "@/lib/axios";
import { LoginSchemaType } from "../schema/login.schema";

export interface LoginResponse {
  status: string;
  message: string;
  userName: string;
  token: {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
    id_token: string;
  };
}

export interface GetUsersParams {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetCustomRolesParams extends GetUsersParams {
  level?: string;
}

export interface GetApiKeysParams {
  offset?: number;
  limit?: number;
  fullTextSearch?: string;
  status?: string;
}

export interface UpdateUserPayload {
  userId?: string | null;
  userName: string;
  userEmail: string;
  name: string;
  lastName: string;
  phoneNumber: string;
  secondaryEmail?: string;
}

export interface UpdatePasswordPayload {
  userName: string;
  currentPassword: string;
  newPassword: string;
}

export interface InviteUserPayload {
  userName: string;
  tmpUserEmail: string; 
  tags: string;
  customRoleId: string; 
  roles: string[];      
}

export const authApi = {
  signIn: async (data: LoginSchemaType): Promise<LoginResponse> => {
    const payload = {
      userName: data.username,
      password: data.password,
    };
    const response = await client.post("/api/Auth/org/temp/action/Login", payload);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await client.post("/api/Auth/org/temp/action/Refresh", { refreshToken });
    return response.data;
  },

  getUserAllowedOrg: async (): Promise<string[]> => {
    const response = await client.get("/api/OnlyUser/org/temp/action/GetUserAllowedOrg");
    return response.data;
  },

  signOut: async () => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.post(`/api/OnlyUser/org/${orgId}/action/Logout`);
    return response.data;
  },

  getUsers: async (params: GetUsersParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 10,
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/GetUsers`, payload);
    return response.data;
  },

  getUserCount: async (params: GetUsersParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/GetUserCount`, payload);
    return response.data;
  },

  inviteUser: async (data: InviteUserPayload) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/InviteUser`, data);
    return response.data;
  },

  getRoles: async (params: GetUsersParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 100, 
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/Role/org/${orgId}/action/GetRoles`, payload);
    return response.data;
  },

  getCustomRoles: async (params: GetCustomRolesParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 100,
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
      level: params.level || "" 
    };
    const response = await client.post(`/api/CustomRole/org/${orgId}/action/GetCustomRoles`, payload);
    return response.data;
  },

  getApiKeys: async (params: GetApiKeysParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 10,
      fullTextSearch: params.fullTextSearch || "",
      status: params.status || ""
    };
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/GetApiKeys`, payload);
    return response.data;
  },

  getApiKeysCount: async (params: GetApiKeysParams = {}) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
      status: params.status || ""
    };
    const response = await client.post(`/api/ApiKey/org/${orgId}/action/GetApiKeysCount`, payload);
    return response.data;
  },

  getUserDetail: async (userName: string) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.get(
      `/api/OnlyUser/org/${orgId}/action/GetUserByUserName/${userName}`
    );
    return response.data;
  },

  updateUser: async (userName: string, data: UpdateUserPayload) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.post(
      `/api/OnlyUser/org/${orgId}/action/UpdateUserByUserName/${userName}`,
      data
    );
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordPayload) => {
    const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
    const response = await client.post(
      `/api/OnlyUser/org/${orgId}/action/UpdatePassword`,
      data
    );
    return response.data;
  },
  enableUser: async (orgUserId: string) => {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
  const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/EnableUserById/${orgUserId}`);
  return response.data;
},

  disableUser: async (orgUserId: string) => {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
  const response = await client.post(`/api/OrganizationUser/org/${orgId}/action/DisableUserById/${orgUserId}`);
  return response.data;
},
  deleteUser: async (orgUserId: string) => {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";
  const response = await client.delete(`/api/OrganizationUser/org/${orgId}/action/DeleteUserById/${orgUserId}`);
  return response.data;
},

  getProfile: async () => {
    const response = await client.get("/auth/me");
    return response.data;
  },
};