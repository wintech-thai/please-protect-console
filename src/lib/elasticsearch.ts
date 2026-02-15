import { client } from "@/lib/axios";
import { AuditLogDocument } from "@/types/audit-log";

export interface EsHit<T> {
  _index: string;
  _type?: string;
  _id: string;
  _score: number;
  _source: T;
}

export interface EsResponse<T> {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: EsHit<T>[];
  };
  aggregations?: any;
}

export interface EsSearchPayload {
  from?: number;
  size?: number;
  query?: any;
  sort?: any[];
  _source?: string[] | boolean;
  aggs?: any;
  [key: string]: any;
}


export const esService = {
  search: async <T>(endpoint: string, payload: EsSearchPayload): Promise<EsResponse<T>> => {
    const response = await client.post(endpoint, payload);
    return response.data;
  },

  getAuditLogs: async <T = AuditLogDocument>(orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required for Audit Log search.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/pp-*/_search`;

    return esService.search<T>(endpoint, payload);
  },

  /**
   * Get the current ingestion rate (docs/sec) for censor-events index.
   * @param orgId Organization ID
   * @param start Unix timestamp (seconds) — start of range
   * @param end   Unix timestamp (seconds) — end of range
   */
  getCensorEventsRate: async (orgId: string, start: number, end: number): Promise<number> => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    const durationSec = end - start;

    const payload: EsSearchPayload = {
      size: 0,
      query: {
        range: {
          "@timestamp": {
            gte: new Date(start * 1000).toISOString(),
            lte: new Date(end * 1000).toISOString(),
          },
        },
      },
    };

    const res = await esService.search(endpoint, payload);
    const count = res.hits?.total?.value ?? 0;
    return durationSec > 0 ? count / durationSec : 0;
  },

  /**
   * Get ingestion history (doc count per interval) over a time range.
   * @param orgId Organization ID
   * @param start Unix timestamp (seconds)
   * @param end   Unix timestamp (seconds)
   * @param step  Interval in seconds (e.g. 60 = 1 minute buckets)
   */
  getCensorEventsHistory: async (
    orgId: string,
    start: number,
    end: number,
    step: number = 60,
  ): Promise<{ time: string; input: number }[]> => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;

    const payload: EsSearchPayload = {
      size: 0,
      query: {
        range: {
          "@timestamp": {
            gte: new Date(start * 1000).toISOString(),
            lte: new Date(end * 1000).toISOString(),
          },
        },
      },
      aggs: {
        per_interval: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: `${step}s`,
          },
        },
      },
    };

    const res = await esService.search(endpoint, payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buckets: any[] = res.aggregations?.per_interval?.buckets ?? [];

    return buckets.map((b) => {
      const d = new Date(b.key);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return {
        time: `${hh}:${mm}`,
        input: step > 0 ? b.doc_count / step : 0, // convert count → docs/sec
      };
    });
  },
};
