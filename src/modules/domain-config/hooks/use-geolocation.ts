"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configurationApi } from "../api/configuration.api";

export interface GeoLocation {
  site_name?: string;
  country?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

const GEO_KEY = ["geoLocation"] as const;

function parseGeoLocation(raw: string | undefined): GeoLocation | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeoLocation;
  } catch {
    return null;
  }
}

export function useGeoLocation() {
  return useQuery({
    queryKey: GEO_KEY,
    queryFn: async () => {
      const entry = await configurationApi.getCurrentGeoLocation();
      return parseGeoLocation(entry.configValue);
    },
    retry: false,
  });
}

export function useSaveGeoLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (geo: GeoLocation) =>
      configurationApi.setCurrentGeoLocation(JSON.stringify(geo)),
    onSuccess: (_, geo) => {
      queryClient.setQueryData(GEO_KEY, geo);
    },
  });
}
