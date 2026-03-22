import dayjs from "dayjs";
import { CloudConnectLogDocument } from "../cloud-connect.schema";

export interface CloudConnectTableRow {
  id: string;
  originalLog: CloudConnectLogDocument;
  timestamp: string;
  formattedDate: string;
  status: number | null;
  isError: boolean;
  domain: string;
  path: string;
  description: string;
  latencyMs: number | null;
}

export function mapCloudConnectLogsToTableRows(logs: CloudConnectLogDocument[]): CloudConnectTableRow[] {
  return logs.map((log, idx) => {
    const logId = log.id || String(idx);
    const status = log.data?.response?.status;
    const isError = status ? (status < 200 || status >= 300) : false;
    
    let formattedDate = log["@timestamp"] || "-";
    try {
      formattedDate = dayjs(log["@timestamp"]).format("M/D/YYYY, h:mm:ss A");
    } catch {
      // ignore
    }

    return {
      id: logId,
      originalLog: log,
      timestamp: log["@timestamp"] || "",
      formattedDate,
      status: status || null,
      isError,
      domain: log.data?.CloudConnectDomain || "-",
      path: log.data?.CloudConnectPath || "-",
      description: log.data?.response?.body || "-",
      latencyMs: log.data?.response?.latency_ms ?? null
    };
  });
}
