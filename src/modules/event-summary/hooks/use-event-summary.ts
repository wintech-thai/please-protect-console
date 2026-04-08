import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  eventSummaryApi,
  type EventSummaryDashboardParams,
  type HistogramBucket,
  type TermsBucket,
} from "../api/event-summary.api";

export const eventSummaryKeys = {
  all: ["event-summary"] as const,
  dashboard: (params: EventSummaryDashboardParams, refreshKey: number) =>
    [
      ...eventSummaryKeys.all,
      "dashboard",
      params.fromDate,
      params.toDate,
      params.durationSec,
      params.selectedDatasets.join("|"),
      refreshKey,
    ] as const,
};

export function useEventSummaryDashboard(params: EventSummaryDashboardParams, refreshKey: number) {
  const query = useQuery({
    queryKey: eventSummaryKeys.dashboard(params, refreshKey),
    queryFn: () => eventSummaryApi.getDashboardRaw(params),
    placeholderData: keepPreviousData,
  });

  const transformed = useMemo(() => {
    if (!query.data) {
      return {
        datasetOptions: [] as TermsBucket[],
        datasetBuckets: [] as TermsBucket[],
        sourceBuckets: [] as TermsBucket[],
        destinationBuckets: [] as TermsBucket[],
        epsSeries: [] as Record<string, unknown>[],
        datasetSeries: [] as Record<string, unknown>[],
        sourceUniqueSeries: [] as Record<string, unknown>[],
        destinationUniqueSeries: [] as Record<string, unknown>[],
        totalEvents: 0,
        currentEps: 0,
        avgEps: 0,
        sourceField: "source.ip.keyword",
        destinationField: "destination.ip.keyword",
      };
    }

    const { response, stepSec, sourceField, destinationField } = query.data;
    const aggs = response.aggregations;
    const buckets: HistogramBucket[] = aggs?.eps_over_time?.buckets ?? [];
    const datasetBuckets: TermsBucket[] = aggs?.datasets?.buckets ?? [];
    const lineKeys: string[] = datasetBuckets.slice(0, 6).map((b: TermsBucket) => b.key);

    const epsSeries = buckets.map((b) => {
      const byDataset = new Map((b.by_dataset?.buckets ?? []).map((i) => [i.key, i.doc_count]));
      const row: Record<string, unknown> = {
        time: b.key_as_string,
        total: Number((b.doc_count / stepSec).toFixed(3)),
      };
      lineKeys.forEach((k: string) => {
        row[k] = Number((((byDataset.get(k) ?? 0) as number) / stepSec).toFixed(3));
      });
      return row;
    });

    const datasetSeries = buckets.map((b) => {
      const byDataset = new Map((b.by_dataset?.buckets ?? []).map((i) => [i.key, i.doc_count]));
      const row: Record<string, unknown> = { time: b.key_as_string };
      lineKeys.forEach((k: string) => {
        row[k] = byDataset.get(k) ?? 0;
      });
      return row;
    });

    const sourceUniqueSeries = (aggs?.source_ips_over_time?.buckets ?? []).map((b: HistogramBucket) => ({
      time: b.key_as_string,
      value: b.unique_source_ips?.value ?? 0,
    }));

    const destinationUniqueSeries = (aggs?.destination_ips_over_time?.buckets ?? []).map((b: HistogramBucket) => ({
      time: b.key_as_string,
      value: b.unique_destination_ips?.value ?? 0,
    }));

    const totalEvents = response.hits?.total?.value ?? 0;
    const lastBucket = buckets[buckets.length - 1];
    const currentEps = lastBucket ? lastBucket.doc_count / stepSec : 0;
    const avgEps = params.durationSec > 0 ? totalEvents / params.durationSec : 0;

    return {
      datasetOptions: aggs?.dataset_options?.buckets ?? [],
      datasetBuckets,
      sourceBuckets: aggs?.source_ips?.buckets ?? [],
      destinationBuckets: aggs?.destination_ips?.buckets ?? [],
      epsSeries,
      datasetSeries,
      sourceUniqueSeries,
      destinationUniqueSeries,
      totalEvents,
      currentEps,
      avgEps,
      sourceField,
      destinationField,
    };
  }, [params.durationSec, query.data]);

  return {
    ...query,
    ...transformed,
  };
}
