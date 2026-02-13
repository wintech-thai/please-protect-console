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
  }
};