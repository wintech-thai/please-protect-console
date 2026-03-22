import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cloudConnectConfigApi } from "../api/cloud-connect-config.api";

export type CloudConfigField =
  | "cloudUrl"
  | "cloudConnectKey"
  | "cloudConnectFlag";

export function useCloudConfig() {
  return useQuery({
    queryKey: ["cloudConnectConfig"],
    queryFn: async () => {
      const [cloudUrl, cloudConnectKey, cloudConnectFlag] = await Promise.all([
        cloudConnectConfigApi.getCloudUrl().catch(() => ({ configValue: "" })),
        cloudConnectConfigApi
          .getCloudConnectKey()
          .catch(() => ({ configValue: "" })),
        cloudConnectConfigApi
          .getCloudConnectFlag()
          .catch(() => ({ configValue: "false" })),
      ]);
      return { cloudUrl, cloudConnectKey, cloudConnectFlag };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveCloudConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: CloudConfigField;
      value: string;
    }) => {
      switch (field) {
        case "cloudUrl":
          return cloudConnectConfigApi.setCloudUrl(value);
        case "cloudConnectKey":
          return cloudConnectConfigApi.setCloudConnectKey(value);
        case "cloudConnectFlag":
          return cloudConnectConfigApi.setCloudConnectFlag(value);
        default:
          throw new Error("Invalid config field");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudConnectConfig"] });
    },
  });
}
