import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

export type RuleState = "inactive" | "pending" | "firing" | string;

export interface AlertRuleItem {
  state: RuleState;
  name: string;
  query: string;
  duration: number;
  keepFiringFor?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  alerts?: unknown[];
  health?: string;
  evaluationTime?: number;
  lastEvaluation?: string;
  type?: string;
}

export interface AlertRuleGroup {
  name: string;
  file?: string;
  rules: AlertRuleItem[];
  interval?: number;
  limit?: number;
  evaluationTime?: number;
  lastEvaluation?: string;
}

interface AlertRulesResponse {
  status?: string;
  data?: {
    groups?: AlertRuleGroup[];
  };
  groups?: AlertRuleGroup[];
}

export const alertRulesApi = {
  getAlertRules: async (): Promise<AlertRuleGroup[]> => {
    const orgId = getOrgId();
    const { data } = await client.get<AlertRulesResponse>(
      `/api/AlertRule/org/${orgId}/action/GetAlertRules`,
    );

    if (Array.isArray(data?.data?.groups)) return data.data.groups;
    if (Array.isArray(data?.groups)) return data.groups;
    return [];
  },
};
