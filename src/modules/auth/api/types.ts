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

export interface CreateApiKeyPayload {
  keyName: string;
  description: string;
  customRoleId: string;
  roles: string[];
}

export interface ApiKeyResponse {
  keyId: string;
  apiKey: string; 
  orgId: string;
  keyName: string;
  keyDescription: string;
  keyStatus: string;
  rolesList: string;
  customRoleName?: string;
  customRoleDesc?: string;
}