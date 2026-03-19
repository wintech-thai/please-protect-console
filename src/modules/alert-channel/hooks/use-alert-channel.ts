import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { 
  alertChannelApi, 
  type AlertChannel, 
  type GetAlertChannelsParams,
  type AddAlertChannelPayload,
  type UpdateAlertChannelPayload
} from "../api/alert-channel.api";

export const alertChannelKeys = {
  all: ["alert-channel"] as const,
  list: (params: GetAlertChannelsParams) => [...alertChannelKeys.all, "list", params] as const,
  detail: (id: string) => [...alertChannelKeys.all, "detail", id] as const,
};

type AlertChannelsOptions = Omit<UseQueryOptions<AlertChannel[]>, "queryKey" | "queryFn">;
type AlertChannelDetailOptions = Omit<UseQueryOptions<AlertChannel>, "queryKey" | "queryFn">;

export function useAlertChannels(params: GetAlertChannelsParams = {}, options?: AlertChannelsOptions) {
  return useQuery({
    queryKey: alertChannelKeys.list(params),
    queryFn: () => alertChannelApi.getAlertChannels(params),
    ...options,
  });
}

export function useAlertChannelDetail(id: string | null, options?: AlertChannelDetailOptions) {
  return useQuery({
    queryKey: alertChannelKeys.detail(id ?? ""),
    queryFn: () => alertChannelApi.getAlertChannelById(id!),
    enabled: !!id,
    ...options,
  });
}

export function useAddAlertChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddAlertChannelPayload) => alertChannelApi.addAlertChannel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.all });
    },
  });
}

export function useUpdateAlertChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAlertChannelPayload }) => 
      alertChannelApi.updateAlertChannelById(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.all });
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.detail(variables.id) });
    },
  });
}

export function useEnableAlertChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertChannelApi.enableAlertChannelById(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.all });
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.detail(id) });
    },
  });
}

export function useDisableAlertChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertChannelApi.disableAlertChannelById(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.all });
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.detail(id) });
    },
  });
}

export function useDeleteAlertChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertChannelApi.deleteAlertChannelById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertChannelKeys.all });
    },
  });
}
