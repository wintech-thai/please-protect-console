import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { alertRulesApi, type AlertRuleGroup } from "../api/alert-rules.api";

export const alertRulesKeys = {
  all: ["alert-rules"] as const,
  list: () => [...alertRulesKeys.all, "list"] as const,
};

type AlertRulesOptions = Omit<
  UseQueryOptions<AlertRuleGroup[]>,
  "queryKey" | "queryFn"
>;

export function useAlertRules(options?: AlertRulesOptions) {
  return useQuery({
    queryKey: alertRulesKeys.list(),
    queryFn: () => alertRulesApi.getAlertRules(),
    ...options,
  });
}
