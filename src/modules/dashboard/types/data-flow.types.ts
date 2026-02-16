import type React from "react";

export type NodeType = "Interface" | "Processor" | "Topic" | "DataStore";

export interface NodeData {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  tag?: string;
  icon: React.ElementType;
}

export type NodeRates = Record<string, { inputRate: number; outputRate: number }>;

export interface HistoryPoint {
  time: string;
  input: number;
  output?: number;
}

export interface DataFlowNodesTranslations {
  interface: string;
  interfaceDesc: string;
  receiver: string;
  receiverDesc: string;
  topicRaw: string;
  topicRawDesc: string;
  transformer: string;
  transformerDesc: string;
  topicTransformed: string;
  topicTransformedDesc: string;
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
  last6h: string;
  last12h: string;
  last24h: string;
  last2d: string;
  last7d: string;
  last30d: string;
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
  timePicker: DataFlowTimePickerTranslations;
}
