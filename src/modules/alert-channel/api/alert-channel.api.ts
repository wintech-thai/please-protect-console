import { client } from "@/lib/axios";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AlertChannelType = "Discord" | string;
export type AlertChannelStatus = "Enabled" | "Disabled";

export interface AlertChannel {
  id: string;
  orgId: string;
  channelName: string;
  description: string;
  tags: string;
  type: AlertChannelType;
  status: AlertChannelStatus;
  discordWebhookUrl: string;
  createdDate: string; // ISO 8601
}

export interface GetAlertChannelsParams {
  fullTextSearch?: string;
}

export interface AddAlertChannelPayload {
  Type: AlertChannelType;
  ChannelName: string;
  Description: string;
  DiscordWebhookUrl: string;
  Tags: string;
  Status: AlertChannelStatus;
}

export interface UpdateAlertChannelPayload {
  ChannelName: string;
  Description: string;
  DiscordWebhookUrl: string;
  Tags: string;
}

export interface AlertChannelDetailResponse {
  status: string;
  description: string;
  notiAlertChannel: AlertChannel;
}

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const alertChannelApi = {
  getAlertChannels: async ({
    fullTextSearch = "",
  }: GetAlertChannelsParams = {}): Promise<AlertChannel[]> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertChannel[]>(
      `/api/AlertChannel/org/${orgId}/action/GetAlertChannels`,
      {
        FullTextSearch: fullTextSearch,
      },
    );
    return data;
  },

  getAlertChannelById: async (id: string): Promise<AlertChannel> => {
    const orgId = getOrgId();
    const { data } = await client.get<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/GetAlertChannelById/${id}`,
    );
    return data.notiAlertChannel;
  },

  addAlertChannel: async (payload: AddAlertChannelPayload): Promise<AlertChannelDetailResponse> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/AddAlertChannel`,
      payload
    );
    return data;
  },

  updateAlertChannelById: async (id: string, payload: UpdateAlertChannelPayload): Promise<AlertChannelDetailResponse> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/UpdateAlertChannelById/${id}`,
      payload
    );
    return data
  },

  enableAlertChannelById: async (id: string): Promise<AlertChannel> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/EnableAlertChannelById/${id}`,
      {}
    );
    return data.notiAlertChannel;
  },

  disableAlertChannelById: async (id: string): Promise<AlertChannel> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/DisableAlertChannelById/${id}`,
      {}
    );
    return data.notiAlertChannel;
  },

  deleteAlertChannelById: async (id: string): Promise<AlertChannel> => {
    const orgId = getOrgId();
    const { data } = await client.delete<AlertChannelDetailResponse>(
      `/api/AlertChannel/org/${orgId}/action/DeleteAlertChannelById/${id}`
    );
    return data.notiAlertChannel;
  },
};
