import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { alertFiredApi, type AlertEvent } from "../api/alert-fired.api";

export const alertFiredKeys = {
  all: ["alert-fired"] as const,
  list: (search: string) => [...alertFiredKeys.all, "list", search] as const,
  detail: (id: string) => [...alertFiredKeys.all, "detail", id] as const,
};

type AlertEventsOptions = Omit<UseQueryOptions<AlertEvent[]>, "queryKey" | "queryFn">;
type AlertEventDetailOptions = Omit<UseQueryOptions<AlertEvent>, "queryKey" | "queryFn">;

export function useAlertEvents(search = "", options?: AlertEventsOptions) {
  return useQuery({
    queryKey: alertFiredKeys.list(search),
    queryFn: () => alertFiredApi.getAlertEvents(search),
    ...options,
  });
}

export function useAlertEventDetail(id: string | null, options?: AlertEventDetailOptions) {
  return useQuery({
    queryKey: alertFiredKeys.detail(id ?? ""),
    queryFn: () => alertFiredApi.getAlertEventById(id!),
    enabled: !!id,
    ...options,
  });
}
