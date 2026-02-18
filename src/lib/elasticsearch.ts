import { client } from "@/lib/axios";

// --- 1. Interfaces ---
export interface Layer7EventDocument {
  "@timestamp": string;
  community_id: string;
  "event.dataset": string;
  "source.ip": string;
  "source.port": number;
  "destination.ip": string;
  "destination.port": number;
  [key: string]: any;
}

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
  track_total_hits?: boolean | number;
  [key: string]: any;
}

// --- 2. Helper Functions ---

const calculateDynamicInterval = (query: any): string => {
  try {
    let range: any = null;
    
    if (query?.bool?.must) {
      const rangeObj = query.bool.must.find((m: any) => m.range?.["@timestamp"]);
      range = rangeObj?.range?.["@timestamp"];
    } else if (query?.range?.["@timestamp"]) {
      range = query.range["@timestamp"];
    }

    if (!range || !range.gte || !range.lte) return "1m";

    const start = new Date(range.gte).getTime();
    const end = new Date(range.lte).getTime();
    const diffMinutes = (end - start) / (1000 * 60);

    if (diffMinutes <= 15) return "30s";   
    if (diffMinutes <= 60) return "1m";    
    if (diffMinutes <= 180) return "5m";   
    if (diffMinutes <= 720) return "15m";  
    if (diffMinutes <= 1440) return "30m";
    return "1h";                           
  } catch (e) {
    return "1m";
  }
};

const sanitizeQuery = (query: any): any => {
  if (!query || typeof query !== "object") return query;

  if (Array.isArray(query)) {
    return query.map(sanitizeQuery);
  }

  const sanitized: Record<string, any> = {}; 

  for (const [key, value] of Object.entries(query)) {
    if (key === "term" && typeof value === "object" && value !== null) {
      const entries = Object.entries(value);
      if (entries.length > 0) {
        const [fieldName, fieldValue] = entries[0];

        if (typeof fieldValue === "object" && fieldValue !== null) {
          sanitized["match"] = { [fieldName]: JSON.stringify(fieldValue) };
          continue;
        }
      }
    }

    sanitized[key] = sanitizeQuery(value);
  }
  return sanitized;
};

const flattenMapping = (mapping: any, prefix = ""): string[] => {
  let fields: string[] = [];
  if (!mapping) return [];
  for (const [key, value] of Object.entries(mapping)) {
    if (key.startsWith("_")) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const propValue = value as any;
    if (propValue.properties) {
      fields = [...fields, ...flattenMapping(propValue.properties, fullKey)];
    } else {
      fields.push(fullKey);
      if (propValue.fields) {
        for (const subKey of Object.keys(propValue.fields)) {
          fields.push(`${fullKey}.${subKey}`);
        }
      }
    }
  }
  return fields;
};

// --- 3. Service Logic ---
export const esService = {
  search: async <T>(endpoint: string, payload: EsSearchPayload): Promise<EsResponse<T>> => {
    const cleanPayload = {
      ...payload,
      query: sanitizeQuery(payload.query)
    };
    const response = await client.post(endpoint, cleanPayload);
    return response.data;
  },

  getLayer7Events: async <T = Layer7EventDocument>(orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    return esService.search<T>(endpoint, {
      ...payload,
      track_total_hits: true 
    });
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
      return [];
    }
  },

  getFieldStats: async (orgId: string, fieldName: string, query: any) => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    const isTimeField = fieldName === "@timestamp";

    const runAgg = async (field: string) => {
      return esService.search(endpoint, {
        size: 0,
        query: query,
        track_total_hits: true,
        aggs: {
          top_values: isTimeField 
            ? {
                date_histogram: { 
                  field: field, 
                  fixed_interval: calculateDynamicInterval(query), 
                  min_doc_count: 0,
                  format: "HH:mm:ss" 
                }
              }
            : {
                terms: { field: field, size: 5, shard_size: 10 }
              }
        }
      });
    };

    try {
      const res = await runAgg(fieldName);
      return { 
        buckets: res.aggregations?.top_values?.buckets || [], 
        total: res.hits.total.value 
      };
    } catch (error: any) {
      if (error.response?.status === 400 && !fieldName.endsWith('.keyword') && !isTimeField) {
        try {
          const fallbackRes = await runAgg(`${fieldName}.keyword`);
          return { buckets: fallbackRes.aggregations?.top_values?.buckets || [], total: fallbackRes.hits.total.value };
        } catch (e) { return { buckets: [], total: 0 }; }
      }
      return { buckets: [], total: 0 };
    }
  },

  getLayer7ChartData: async (orgId: string, start: number, end: number, step: string = "1m", query?: any) => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    
    let finalQuery: any;

    if (query && typeof query === 'object') {
      finalQuery = query;
    } else {
      const mustQueries: any[] = [
        { 
          range: { 
            "@timestamp": { 
              gte: new Date(start * 1000).toISOString(), 
              lte: new Date(end * 1000).toISOString() 
            } 
          } 
        },
        { wildcard: { "event.dataset": "zeek.*" } }
      ];

      if (typeof query === "string" && query.trim() !== "") {
        mustQueries.push({ query_string: { query: query } });
      }

      finalQuery = { bool: { must: mustQueries } };
    }

    const payload: EsSearchPayload = {
      size: 0,
      track_total_hits: true,
      query: finalQuery,
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
          aggs: { by_dataset: { terms: { field: "event.dataset.keyword", size: 10 } } }
        }
      }
    };

    try {
      const res = await esService.search(endpoint, payload);
      return res.aggregations?.events_over_time?.buckets || [];
    } catch (e) { 
      console.error("Chart Data Error:", e);
      return []; 
    }
  },

  getAuditLogs: async <T = AuditLogDocument>(orgId: string, payload: EsSearchPayload) => {
    if (!orgId) throw new Error("Organization ID is required.");
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/pp-*/_search`;
    return esService.search<T>(endpoint, { ...payload, track_total_hits: true });
  },

  getCensorEventsRate: async (orgId: string, start: number, end: number): Promise<number> => {
    const endpoint = `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`;
    const durationSec = end - start;
    const payload: EsSearchPayload = {
      size: 0,
      track_total_hits: true,
      query: { range: { "@timestamp": { gte: new Date(start * 1000).toISOString(), lte: new Date(end * 1000).toISOString() } } },
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
      track_total_hits: true,
      query: { range: { "@timestamp": { gte: new Date(start * 1000).toISOString(), lte: new Date(end * 1000).toISOString() } } },
      aggs: {
        per_interval: {
          date_histogram: { field: "@timestamp", fixed_interval: `${step}s` },
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
        input: step > 0 ? b.doc_count / step : 0,
      };
    });
  },
};