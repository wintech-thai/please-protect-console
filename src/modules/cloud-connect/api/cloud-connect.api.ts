import { esService, EsSearchPayload } from "@/lib/elasticsearch";
import { CloudConnectLogDocument } from "../cloud-connect.schema";

export const cloudConnectApi = {
  getLogs: async (orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/cc-*/_search`;
    return esService.search<CloudConnectLogDocument>(endpoint, {
      ...payload,
      track_total_hits: true
    });
  },

  getChartData: async (orgId: string, start: number, end: number, step: string, query?: Record<string, unknown>) => {
    if (!orgId) throw new Error("Organization ID is required.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/cc-*/_search`;

    const payload: EsSearchPayload = {
      size: 0,
      track_total_hits: true,
      query: query || { match_all: {} },
      aggs: {
        events_over_time: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: step,
            min_doc_count: 0,
            extended_bounds: {
              min: new Date(start * 1000).toISOString(),
              max: new Date(end * 1000).toISOString()
            }
          },
          aggs: {
            by_dataset: {
              terms: { field: "data.response.status", size: 10 }
            }
          }
        }
      }
    };

    const response = await esService.search<unknown>(endpoint, payload);
    return response.aggregations?.events_over_time?.buckets || [];
  }
};
