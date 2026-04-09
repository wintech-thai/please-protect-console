"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { configurationApi, type ConfigurationEntry } from "../api/configuration.api";

// ─── Query key factory ────────────────────────────────────────────────────────

export const domainConfigKeys = {
  all: ["domainConfig"] as const,
  domain: () => [...domainConfigKeys.all, "domain"] as const,
  logo: () => [...domainConfigKeys.all, "logo"] as const,
  shortName: () => [...domainConfigKeys.all, "shortName"] as const,
  orgDescription: () => [...domainConfigKeys.all, "orgDescription"] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AllConfig {
  domain: ConfigurationEntry | null;
  logo: ConfigurationEntry | null;
  shortName: ConfigurationEntry | null;
  orgDescription: ConfigurationEntry | null;
}

export type ConfigField = "domain" | "logo" | "shortName" | "orgDescription";

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all three configuration values (domain, logo, orgShortName) in
 * parallel.  Uses Promise.allSettled so a single failing endpoint does not
 * block the other two from rendering.
 */
export function useAllConfig() {
  return useQuery<AllConfig>({
    queryKey: domainConfigKeys.all,
    queryFn: async () => {
      const [domainResult, logoResult, shortNameResult, orgDescriptionResult] = await Promise.allSettled([
        configurationApi.getDomain(),
        configurationApi.getLogo(),
        configurationApi.getOrgShortName(),
        configurationApi.getOrgDescription(),
      ]);

      return {
        domain: domainResult.status === "fulfilled" ? domainResult.value : null,
        logo: logoResult.status === "fulfilled" ? logoResult.value : null,
        shortName: shortNameResult.status === "fulfilled" ? shortNameResult.value : null,
        orgDescription:
          orgDescriptionResult.status === "fulfilled"
            ? orgDescriptionResult.value
            : null,
      };
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutation hook that saves a single config field.
 * On success it updates the cached AllConfig entry in-place so the UI
 * reflects the new value without a full refetch.
 */
export function useSaveField() {
  const queryClient = useQueryClient();

  return useMutation<
    ConfigurationEntry,
    Error,
    { field: ConfigField; value: string }
  >({
    mutationFn: ({ field, value }) => {
      switch (field) {
        case "domain":
          return configurationApi.setDomain(value);
        case "logo":
          return configurationApi.setLogo(value);
        case "shortName":
          return configurationApi.setOrgShortName(value);
        case "orgDescription":
          return configurationApi.setOrgDescription(value);
        default:
          return Promise.reject(new Error(`Unknown field: ${field}`));
      }
    },
    onSuccess: (updated, { field }) => {
      // Optimistically update the cache so the saved value is visible immediately
      queryClient.setQueryData<AllConfig>(domainConfigKeys.all, (prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: updated };
      });
    },
  });
}
