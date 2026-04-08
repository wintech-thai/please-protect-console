import { esService, type EsResponse } from "@/lib/elasticsearch";

export type TermsBucket = {
  key: string;
  doc_count: number;
};

export type HistogramBucket = {
  key: number;
  key_as_string: string;
  doc_count: number;
  by_dataset?: { buckets: TermsBucket[] };
  unique_source_ips?: { value: number };
  unique_destination_ips?: { value: number };
};

export type DashboardAggs = {
  dataset_options?: { buckets: TermsBucket[] };
  datasets?: { buckets: TermsBucket[] };
  source_ips?: { buckets: TermsBucket[] };
  destination_ips?: { buckets: TermsBucket[] };
  eps_over_time?: { buckets: HistogramBucket[] };
  source_ips_over_time?: { buckets: HistogramBucket[] };
  destination_ips_over_time?: { buckets: HistogramBucket[] };
};

export type DashboardResponse = EsResponse<unknown> & {
  aggregations?: DashboardAggs;
};

export interface EventSummaryDashboardParams {
  fromDate: string;
  toDate: string;
  durationSec: number;
  selectedDatasets: string[];
}

export interface EventSummaryDashboardRaw {
  response: DashboardResponse;
  stepSec: number;
  sourceField: string;
  destinationField: string;
}

const getOrgId = () =>
  typeof window !== "undefined" ? localStorage.getItem("orgId") || "default" : "default";

const endpointByOrg = (orgId: string) =>
  `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;

const getIntervalByRange = (durationSec: number) => {
  if (durationSec <= 3600) return { interval: "1m", stepSec: 60 };
  if (durationSec <= 6 * 3600) return { interval: "5m", stepSec: 300 };
  if (durationSec <= 24 * 3600) return { interval: "15m", stepSec: 900 };
  if (durationSec <= 7 * 24 * 3600) return { interval: "1h", stepSec: 3600 };
  return { interval: "3h", stepSec: 10800 };
};

const buildBaseMust = (fromDate: string, toDate: string) => [
  { range: { "@timestamp": { gte: fromDate, lte: toDate } } },
  { wildcard: { "event.dataset": "*" } },
];

const isFielddataError = (error: unknown) => {
  const reason = JSON.stringify((error as { response?: { data?: unknown } })?.response?.data || "").toLowerCase();
  return reason.includes("fielddata is disabled") || reason.includes("illegal_argument_exception");
};

async function executeDashboardQuery(
  orgId: string,
  params: EventSummaryDashboardParams,
  sourceField: string,
  destinationField: string,
): Promise<EventSummaryDashboardRaw> {
  const { interval, stepSec } = getIntervalByRange(params.durationSec);
  const baseMust = buildBaseMust(params.fromDate, params.toDate);
  const selectedDatasetFilter = params.selectedDatasets.length
    ? [{ terms: { "event.dataset.keyword": params.selectedDatasets } }]
    : [];

  const [optionsResponse, response] = await Promise.all([
    esService.search<unknown>(endpointByOrg(orgId), {
      size: 0,
      query: {
        bool: {
          must: baseMust,
        },
      },
      aggs: {
        dataset_options: { terms: { field: "event.dataset.keyword", size: 100 } },
      },
    }) as Promise<DashboardResponse>,
    esService.search<unknown>(endpointByOrg(orgId), {
      size: 0,
      track_total_hits: true,
      query: {
        bool: {
          must: [...baseMust, ...selectedDatasetFilter],
        },
      },
      aggs: {
        datasets: { terms: { field: "event.dataset.keyword", size: 12 } },
        source_ips: { terms: { field: sourceField, size: 10 } },
        destination_ips: { terms: { field: destinationField, size: 10 } },
        eps_over_time: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: {
              min: params.fromDate,
              max: params.toDate,
            },
          },
          aggs: {
            by_dataset: { terms: { field: "event.dataset.keyword", size: 8 } },
          },
        },
        source_ips_over_time: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: {
              min: params.fromDate,
              max: params.toDate,
            },
          },
          aggs: {
            unique_source_ips: { cardinality: { field: sourceField } },
          },
        },
        destination_ips_over_time: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: {
              min: params.fromDate,
              max: params.toDate,
            },
          },
          aggs: {
            unique_destination_ips: { cardinality: { field: destinationField } },
          },
        },
      },
    }) as Promise<DashboardResponse>,
  ]);

  response.aggregations = {
    ...response.aggregations,
    dataset_options: optionsResponse.aggregations?.dataset_options,
  };

  return {
    response,
    stepSec,
    sourceField,
    destinationField,
  };
}

export const eventSummaryApi = {
  getDashboardRaw: async (params: EventSummaryDashboardParams): Promise<EventSummaryDashboardRaw> => {
    const orgId = getOrgId();
    const candidates: Array<{ sourceField: string; destinationField: string }> = [
      { sourceField: "source.ip.keyword", destinationField: "destination.ip.keyword" },
      { sourceField: "source.ip", destinationField: "destination.ip.keyword" },
      { sourceField: "source.ip.keyword", destinationField: "destination.ip" },
      { sourceField: "source.ip", destinationField: "destination.ip" },
    ];

    let lastError: unknown = null;
    for (const candidate of candidates) {
      try {
        return await executeDashboardQuery(orgId, params, candidate.sourceField, candidate.destinationField);
      } catch (error) {
        lastError = error;
        if (!isFielddataError(error)) {
          throw error;
        }
      }
    }

    throw lastError ?? new Error("Unable to query Event Summary dashboard");
  },
};
