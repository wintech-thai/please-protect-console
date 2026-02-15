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

export interface DataFlowTranslations {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  retry: string;
  nodes: DataFlowNodesTranslations;
  details: DataFlowDetailsTranslations;
}
