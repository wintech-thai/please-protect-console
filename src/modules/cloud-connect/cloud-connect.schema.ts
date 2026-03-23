export interface CloudConnectLogDocument {
  id?: string;
  "@timestamp": string;
  data: {
    CloudConnectDomain: string;
    CloudConnectPath: string;
    Environment?: string;
    response: {
      status: number;
      body: string;
      latency_ms: number;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ElasticSearchBucket {
  key_as_string?: string;
  key: number;
  doc_count: number;
  by_dataset?: {
    buckets: Array<{ key: number | string; doc_count: number }>;
  };
  [key: string]: unknown;
}
