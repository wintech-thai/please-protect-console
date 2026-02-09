import { client } from "@/lib/axios";
import { 
  GetUsersParams, 
  InviteUserPayload, 
  UpdateUserPayload, 
  UpdatePasswordPayload 
} from "./types";

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp");

export const userApi = {
  getUsers: async (params: GetUsersParams = {}) => {
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 10,
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/GetUsers`, payload);
    return response.data;
  },

  getUserCount: async (params: GetUsersParams = {}) => {
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/GetUserCount`, payload);
    return response.data;
  },

  inviteUser: async (data: InviteUserPayload) => {
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/InviteUser`, data);
    return response.data;
  },

  confirmInvite: async (orgId: string, token: string, payload: any) => {
    const url = `/api/Registration/org/${orgId}/action/ConfirmNewUserInvitation/${token}/${payload.username}`;
    const body = {
      Email: payload.email,
      UserName: payload.username,
      Password: payload.password,
      Name: payload.firstName,
      LastName: payload.lastName,
      OrgUserId: payload.orgUserId
    };
    const response = await client.post(url, body);
    return response.data;
  },

  getForgotPasswordLink: async (orgUserId: string) => {
    const response = await client.get(`/api/OrganizationUser/org/${getOrgId()}/action/GetForgotPasswordLink/${orgUserId}`);
    return response.data;
  },

  getUserDetail: async (userName: string) => {
    const response = await client.get(`/api/OnlyUser/org/${getOrgId()}/action/GetUserByUserName/${userName}`);
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await client.get(`/api/OrganizationUser/org/${getOrgId()}/action/GetUserById/${userId}`);
    return response.data;
  },

  updateUser: async (userName: string, data: UpdateUserPayload) => {
    const response = await client.post(`/api/OnlyUser/org/${getOrgId()}/action/UpdateUserByUserName/${userName}`, data);
    return response.data;
  },

  confirmResetPassword: async (orgId: string, token: string, payload: { password: string; username?: string }) => {
    const url = `/api/Registration/org/${orgId}/action/ConfirmForgotPasswordReset/${token}`;
    
    const body = {
      Password: payload.password,
      UserName: payload.username,
    };

    const response = await client.post(url, body);
    return response.data;
  },
  
  updateUserById: async (userId: string, data: any) => {
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/UpdateUserById/${userId}`, data);
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordPayload) => {
    const response = await client.post(`/api/OnlyUser/org/${getOrgId()}/action/UpdatePassword`, data);
    return response.data;
  },

  enableUser: async (orgUserId: string) => {
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/EnableUserById/${orgUserId}`);
    return response.data;
  },

  disableUser: async (orgUserId: string) => {
    const response = await client.post(`/api/OrganizationUser/org/${getOrgId()}/action/DisableUserById/${orgUserId}`);
    return response.data;
  },

  deleteUser: async (orgUserId: string) => {
    const response = await client.delete(`/api/OrganizationUser/org/${getOrgId()}/action/DeleteUserById/${orgUserId}`);
    return response.data;
  }
};