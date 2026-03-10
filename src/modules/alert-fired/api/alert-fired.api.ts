import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AlertStatus = "firing" | "resolved";
export type AlertSeverity = "none" | "warning" | "critical" | string;

export interface AlertEvent {
  id: string;
  orgId: string;
  name: string;
  summary: string;
  status: AlertStatus;
  detail: string;
  severity: AlertSeverity;
  rawData: string;
  createdDate: string;
}

// rawData parsed structure
export interface RawDataAlert {
  Status: string;
  Labels: Record<string, string>;
  Annotations: Record<string, string>;
  StartsAt?: string;
  EndsAt?: string;
}

export interface RawData {
  Receiver: string;
  Status: string;
  Alerts: RawDataAlert[];
}

export interface AlertEventDetail {
  status: string;
  description: string;
  notiAlertEvent: AlertEvent;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const alertFiredApi = {
  getAlertEvents: async (fullTextSearch = ""): Promise<AlertEvent[]> => {
    const orgId = getOrgId();
    const { data } = await client.post<AlertEvent[]>(
      `api//AlertEvent/org/${orgId}/action/GetAlertEvents`,
      { FullTextSearch: fullTextSearch },
    );
    return data;
  },

  getAlertEventById: async (id: string): Promise<AlertEvent> => {
    const orgId = getOrgId();
    const { data } = await client.get<AlertEventDetail>(
      `/api/AlertEvent/org/${orgId}/action/GetAlertEventById/${id}`,
    );
    return data.notiAlertEvent;
  },
};
