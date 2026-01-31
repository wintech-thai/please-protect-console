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

export const authApi = {
  signIn: async (data: LoginSchemaType): Promise<LoginResponse> => {
    const payload = {
      userName: data.username, 
      password: data.password
    };

    const response = await client.post(
      "/api/Auth/org/temp/action/Login", 
      payload 
    );

    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await client.post("/api/Auth/org/temp/action/Refresh", { refreshToken }); 
    return response.data;
  },

  getProfile: async () => {
    const response = await client.get("/auth/me");
    return response.data;
  },
};