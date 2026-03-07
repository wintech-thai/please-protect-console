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

// ─── Kafka types ──────────────────────────────────────────────────────────────

/**
 * Real shape from GetTopicByName partitions array.
 * NOTE: no offset data here — use GetTopicOffsets for begin/end offsets.
 */
export interface KafkaTopicPartition {
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[];
  hasError: boolean;
  errorReason: string;
}

/**
 * Real shape from GetTopicByName.
 * NOTE: replicationFactor and totalMessages are NOT returned by the server.
 *       Derive replicationFactor from partitions[0].replicas.length.
 *       Derive totalMessages from GetTopicOffsets (sum of endOffset - beginOffset).
 */
export interface KafkaTopicInfo {
  name: string;
  partitionCount: number;
  partitions: KafkaTopicPartition[];
}

export interface KafkaTopicOffsetPartition {
  partition: number;
  earliestOffset: number;
  latestOffset: number;
  messageCount: number;
}

/**
 * Real shape from GetTopicOffsets:
 * { topic, totalPartitions, partitions: [...] }
 */
export interface KafkaTopicOffsets {
  topic: string;
  totalPartitions: number;
  partitions: KafkaTopicOffsetPartition[];
}

/**
 * Derived topic stats computed client-side from KafkaTopicInfo + KafkaTopicOffset[].
 */
export interface KafkaTopicStats {
  partitionCount: number;
  /** Derived from partitions[0].replicas.length */
  replicationFactor: number;
  /** Sum of (endOffset - beginOffset) across all partitions */
  totalMessages: number;
  /** True if any partition has hasError === true */
  hasPartitionError: boolean;
  partitions: KafkaTopicPartition[];
}

/**
 * One row from GetTopicLag — flat per group × partition.
 * { group, topic, partition, committedOffset, latestOffset, lag }
 */
export interface KafkaTopicLagRow {
  group: string;
  topic: string;
  partition: number;
  committedOffset: number;
  latestOffset: number;
  lag: number;
}

/**
 * Aggregated lag summary for one consumer group, derived client-side by
 * grouping KafkaTopicLagRow[] entries by the `group` field.
 */
export interface KafkaGroupLagSummary {
  group: string;
  totalLag: number;
  partitions: KafkaTopicLagRow[];
}

export interface KafkaTopicDetails {
  /** Derived stats (partitions, RF, totalMessages) — null if fetch failed */
  topicStats: KafkaTopicStats | null;
  /** Aggregated per-group summaries, derived from the flat GetTopicLag rows. */
  groupLagSummaries: KafkaGroupLagSummary[];
}

// ─── Translation interfaces ───────────────────────────────────────────────────

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
  // Kafka topic details
  topicInfo: string;
  partitions: string;
  replicationFactor: string;
  totalMessages: string;
  consumerGroups: string;
  noConsumerGroups: string;
  groupId: string;
  groupState: string;
  groupMembers: string;
  totalLag: string;
  loading: string;
  errorLoading: string;
  partitionHealth: string;
  partitionHealthOk: string;
  partitionHealthError: string;
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