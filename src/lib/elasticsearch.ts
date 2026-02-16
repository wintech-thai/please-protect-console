import { client } from "@/lib/axios";

// --- Interfaces ---
export interface Layer7EventDocument {
  "@timestamp": string;
  community_id: string;
  "event.dataset": string;
  "source.ip": string;
  "source.port": number;
  "source.network_zone": string;
  "source.geoip"?: { country_name: string };
  "destination.ip": string;
  "destination.port": number;
  "destination.network_zone": string;
  "destination.geoip"?: { country_name: string };
  [key: string]: any;
}

// Interface สำหรับ Audit Log
export interface AuditLogDocument {
  "@timestamp": string;
  "event.action": string;
  "user.name": string;
  "source.ip": string;
  [key: string]: any;
}

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
  _shards: { total: number; successful: number; skipped: number; failed: number };
  hits: {
    total: { value: number; relation: string };
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

const flattenMapping = (mapping: any, prefix = ""): string[] => {
  let fields: string[] = [];
  if (!mapping) return [];

  for (const [key, value] of Object.entries(mapping)) {
    if (key.startsWith("_")) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && 'properties' in value) {
      fields = [...fields, ...flattenMapping((value as any).properties, fullKey)];
    } else {
      fields.push(fullKey);
    }
  }
  return fields;
};

// --- Service Logic ---
export const esService = {
  search: async <T>(endpoint: string, payload: EsSearchPayload): Promise<EsResponse<T>> => {
    const response = await client.post(endpoint, payload);
    return response.data;
  },

  getLayer7Events: async <T = Layer7EventDocument>(orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    return esService.search<T>(endpoint, payload);
  },

  getMapping: async (orgId: string): Promise<string[]> => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_mapping`;
    try {
      const response = await client.get(endpoint);
      const indices = Object.values(response.data) as any[];

      let properties = null;
      for (const indexData of indices) {
        if (indexData?.mappings?.properties) {
          properties = indexData.mappings.properties;
          break;
        }
      }

      if (properties) {
        const fields = flattenMapping(properties);
        return Array.from(new Set(fields)).sort();
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch mapping:", error);
      return [];
    }
  },

  getFieldStats: async (orgId: string, fieldName: string, query: any) => {
      const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
      if (fieldName === "@timestamp") return { buckets: [], total: 0 };

      const createPayload = (targetField: string): EsSearchPayload => ({
        size: 0,
        query: query,
        aggs: {
          field_values: {
            terms: { field: targetField, size: 5, shard_size: 10 }
          }
        }
      });

      try {
          let res = await esService.search(endpoint, createPayload(fieldName));
          let buckets = res.aggregations?.field_values?.buckets || [];

          if (buckets.length === 0 && !fieldName.includes(".ip") && !fieldName.toLowerCase().includes("port")) {
              try {
                const keywordRes = await esService.search(endpoint, createPayload(`${fieldName}.keyword`));
                if (keywordRes.aggregations?.field_values?.buckets?.length > 0) {
                    buckets = keywordRes.aggregations.field_values.buckets;
                    res = keywordRes;
                }
              } catch (e) { /* ignore */ }
          }

          return { buckets: buckets, total: res.hits.total.value };
      } catch (error) {
          return { buckets: [], total: 0 };
      }
  },

  // ดึงข้อมูลสำหรับกราฟ Histogram Layer 7
  getLayer7ChartData: async (orgId: string, start: number, end: number, step: string = "1m", luceneQuery?: string) => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;

    const mustQueries: any[] = [
      { range: { "@timestamp": { gte: new Date(start * 1000).toISOString(), lte: new Date(end * 1000).toISOString() } } }
    ];

    if (luceneQuery && luceneQuery.trim() !== "") {
      mustQueries.push({ query_string: { query: luceneQuery } });
    }

    const payload: EsSearchPayload = {
      size: 0,
      query: { bool: { must: mustQueries } },
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
            by_dataset: { terms: { field: "event.dataset.keyword" } }
          }
        }
      }
    };

    try {
        const res = await esService.search(endpoint, payload);
        return res.aggregations?.events_over_time?.buckets || [];
    } catch (e) {
        return [];
    }
  },



  getAuditLogs: async <T = AuditLogDocument>(orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required for Audit Log search.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/pp-*/_search`;
    return esService.search<T>(endpoint, payload);
  },

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

  getCensorEventsHistory: async (
    orgId: string,
    start: number,
    end: number,
    step: number = 60,
  ): Promise<{ time: string; input: number; ts: number }[]> => {
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
    const buckets: any[] = res.aggregations?.per_interval?.buckets ?? [];

    return buckets.map((b) => {
      const d = new Date(b.key);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return {
        time: `${hh}:${mm}`,
        ts: Math.floor(b.key / 1000),
        input: step > 0 ? b.doc_count / step : 0, // convert count -> docs/sec
      };
    });
  },
};
