import { client } from "@/lib/axios";
import { LoginSchemaType } from "../schema/login.schema"; 
import { LoginResponse } from "./types";

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

  getProfile: async () => {
    const response = await client.get("/auth/me");
    return response.data;
  },
};