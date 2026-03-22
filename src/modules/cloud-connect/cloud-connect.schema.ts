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
