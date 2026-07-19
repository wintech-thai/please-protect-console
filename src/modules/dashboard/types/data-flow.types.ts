import type React from "react";
import { translations } from "@/locales/dict";

export type NodeType = "Interface" | "Processor" | "DataStore";

export interface NodeData {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  tag?: string;
  icon: React.ElementType;
  // Override the PromQL output query when the default events_out_total metric
  // is unreliable (e.g. pipelines that push via filter-stage Redis XADD).
  outputQuery?: string;
}

export type NodeRates = Record<string, { inputRate: number; outputRate: number }>;

export interface HistoryPoint {
  time: string;
  input: number;
  output?: number;
}

// ─── Network Interface types ──────────────────────────────────────────────────

export interface NetworkInterfaceData {
  id: string;
  name: string;
  macAddress: string;
  ipAddress: string;
  isEnabled: boolean;
  stats?: {
    rxBytes: number;
    txBytes: number;
    rxPackets: number;
    txPackets: number;
  };
}


// ─── Translation interfaces ───────────────────────────────────────────────────

export interface DataFlowNodesTranslations {
  interface: string;
  interfaceDesc: string;
  receiver: string;
  receiverDesc: string;
  aggregator: string;
  aggregatorDesc: string;
  transformer: string;
  transformerDesc: string;
  dispatcher: string;
  dispatcherDesc: string;
  storage: string;
  storageDesc: string;
}

export interface DataFlowDetailsTranslations {
  selectNode: string;
  noMetrics: string;
  inputRate: string;
  outputRate: string;
  history: string;
}

export interface DataFlowTimePickerTranslations {
  absoluteTitle: string;
  from: string;
  to: string;
  apply: string;
  searchPlaceholder: string;
  customRange: string;
  last5m: string;
  last15m: string;
  last30m: string;
  last1h: string;
  last3h: string;
  last4h: string;
  last6h: string;
  last12h: string;
  last24h: string;
  last2d: string;
  last7d: string;
  last30d: string;
}

export interface DataFlowNetworkInterfacesTranslations {
  title: string;
  noInterface: string;
  macAddress: string;
  ipAddress: string;
  status: string;
  enable: string;
  disable: string;
  enabled: string;
  disabled: string;
}


export interface DataFlowTranslations {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  retry: string;
  nodes: DataFlowNodesTranslations;
  details: DataFlowDetailsTranslations;
  lastUpdated: string;
  refresh: string;
  refreshOff: string;
  timePicker: typeof translations.timePicker.EN;
  networkInterfaces: DataFlowNetworkInterfacesTranslations;
}

