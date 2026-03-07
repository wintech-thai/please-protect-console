import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("orgId") || "temp"
    : "temp";

// ─── Response types ───────────────────────────────────────────────────────────

export interface KafkaTopicPartition {
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[];
  hasError: boolean;
  errorReason: string;
}

/**
 * Real shape from GetTopicByName:
 * { name, partitionCount, partitions: [{ partition, leader, replicas, isr, hasError, errorReason }] }
 *
 * NOTE: `replicationFactor` is NOT returned by the server — derive it
 *       client-side from partitions[0].replicas.length.
 *       `totalMessages` is also not here — compute from GetTopicOffsets.
 */
export interface KafkaTopicInfo {
  name: string;
  partitionCount: number;
  partitions: KafkaTopicPartition[];
}

export interface KafkaConsumerGroup {
  groupId: string;
  state: string;
  memberCount: number;
}

export interface KafkaTopicOffsetPartition {
  partition: number;
  earliestOffset: number;
  latestOffset: number;
  messageCount: number;
}

/**
 * Real shape from GetTopicOffsets:
 * { topic, totalPartitions, partitions: [{ partition, earliestOffset, latestOffset, messageCount }] }
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
  /** replicas count from partitions[0].replicas.length (all partitions share the same RF) */
  replicationFactor: number;
  /** sum of (endOffset - beginOffset) across all partitions */
  totalMessages: number;
  /** true if any partition has hasError === true */
  hasPartitionError: boolean;
  partitions: KafkaTopicPartition[];
}

/**
 * One row from GetTopicLag — flat per group × partition.
 *
 * Example:
 * {
 *   "group": "for-dispatcher-es",
 *   "topic": "transformed-topic-beat",
 *   "partition": 0,
 *   "committedOffset": 234593,
 *   "latestOffset": 234593,
 *   "lag": 0
 * }
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
 * Aggregated lag summary for one consumer group across all its partitions.
 * Derived client-side by grouping KafkaTopicLagRow[] by `group`.
 */
export interface KafkaGroupLagSummary {
  group: string;
  totalLag: number;
  partitions: KafkaTopicLagRow[];
}

export interface KafkaConsumerGroupLag {
  groupId: string;
  topic: string;
  totalLag: number;
  partitions: KafkaTopicLagRow[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await client.get<{ data: T }>(path);
  // The proxy may wrap data under `.data` or return it directly
  return (res.data as unknown as { data: T })?.data ?? (res.data as unknown as T);
}

// ─── KafkaAdmin API ───────────────────────────────────────────────────────────

export const kafkaAdminApi = {
  /**
   * List all topics.
   */
  getTopics(): Promise<KafkaTopicInfo[]> {
    const orgId = getOrgId();
    return get(`/api/KafkaAdmin/org/${orgId}/action/GetTopics`);
  },

  /**
   * Get partition metadata for a topic (partitionCount, leader, replicas, isr, hasError).
   * Does NOT include offsets or replicationFactor — derive those client-side.
   */
  getTopicByName(topicName: string): Promise<KafkaTopicInfo> {
    const orgId = getOrgId();
    return get(`/api/KafkaAdmin/org/${orgId}/action/GetTopicByName/${topicName}`);
  },

  /**
   * Get offsets for all partitions of a topic.
   * Returns a single object with a `partitions` array containing
   * { partition, earliestOffset, latestOffset, messageCount } per partition.
   */
  getTopicOffsets(topicName: string): Promise<KafkaTopicOffsets> {
    const orgId = getOrgId();
    return get(`/api/KafkaAdmin/org/${orgId}/action/GetTopicOffsets/${topicName}`);
  },

  /**
   * Get flat per-group×partition lag rows for a topic.
   * Returns one row per (consumer group, partition) combination.
   */
  getTopicLag(topicName: string): Promise<KafkaTopicLagRow[]> {
    const orgId = getOrgId();
    return get(`/api/KafkaAdmin/org/${orgId}/action/GetTopicLag/${topicName}`);
  },

  /**
   * List all consumer groups in the cluster.
   */
  getConsumerGroups(): Promise<KafkaConsumerGroup[]> {
    const orgId = getOrgId();
    return get(`/api/KafkaAdmin/org/${orgId}/action/GetConsumerGroups`);
  },

  /**
   * List consumer groups that are subscribed to a specific topic.
   */
  getConsumerGroupsByTopic(topicName: string): Promise<KafkaConsumerGroup[]> {
    const orgId = getOrgId();
    return get(
      `/api/KafkaAdmin/org/${orgId}/action/GetConsumerGroupByTopic/${topicName}`,
    );
  },

  /**
   * Get the lag breakdown for a specific consumer group (across all its topics).
   */
  getConsumerGroupLag(groupId: string): Promise<KafkaConsumerGroupLag[]> {
    const orgId = getOrgId();
    return get(
      `/api/KafkaAdmin/org/${orgId}/action/GetConsumerGroupLag/${groupId}`,
    );
  },
};

// ─── Client-side helpers ──────────────────────────────────────────────────────

/**
 * Derive KafkaTopicStats from the two API responses that together contain all
 * the information we need:
 *  - KafkaTopicInfo    → partition metadata (replicas for RF, hasError)
 *  - KafkaTopicOffsets → per-partition messageCount → totalMessages
 *
 * replicationFactor is derived from partitions[0].replicas.length.
 * totalMessages is the sum of messageCount across all offset partitions
 * (each messageCount = latestOffset - earliestOffset, already computed server-side).
 */
export function buildTopicStats(
  info: KafkaTopicInfo,
  offsets: KafkaTopicOffsets | null,
): KafkaTopicStats {
  const replicationFactor = info.partitions[0]?.replicas?.length ?? 1;

  const totalMessages = (offsets?.partitions ?? []).reduce(
    (sum, o) => sum + (o.messageCount ?? 0),
    0,
  );

  const hasPartitionError = info.partitions.some((p) => p.hasError);

  return {
    partitionCount: info.partitionCount ?? info.partitions.length,
    replicationFactor,
    totalMessages,
    hasPartitionError,
    partitions: info.partitions,
  };
}

/**
 * Aggregate a flat KafkaTopicLagRow[] (one row per group×partition) into one
 * KafkaGroupLagSummary per unique group, with totalLag summed across partitions.
 */
export function aggregateLagByGroup(rows: KafkaTopicLagRow[]): KafkaGroupLagSummary[] {
  const map = new Map<string, KafkaGroupLagSummary>();

  for (const row of rows) {
    const existing = map.get(row.group);
    if (existing) {
      existing.totalLag += row.lag;
      existing.partitions.push(row);
    } else {
      map.set(row.group, {
        group: row.group,
        totalLag: row.lag,
        partitions: [row],
      });
    }
  }

  return Array.from(map.values());
}