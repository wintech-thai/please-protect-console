import type { AlertRuleGroup, AlertRuleItem } from "../api/alert-rules.api";

export interface AlertRuleRow {
  id: string;
  groupName: string;
  groupFile: string;
  state: string;
  name: string;
  query: string;
  duration: number;
  keepFiringFor: number;
  severity: string;
  summary: string;
  description: string;
  health: string;
  type: string;
  lastEvaluation: string;
  alertsCount: number;
}

export function mapAlertRulesToRows(groups: AlertRuleGroup[]): AlertRuleRow[] {
  const rows: AlertRuleRow[] = [];

  groups.forEach((group, groupIndex) => {
    (group.rules || []).forEach((rule: AlertRuleItem, ruleIndex: number) => {
      const severity = rule.labels?.severity || "-";
      const summary = rule.annotations?.summary || "";
      const description = rule.annotations?.description || "";

      rows.push({
        id: `${group.name || "group"}:${rule.name || "rule"}:${groupIndex}:${ruleIndex}`,
        groupName: group.name || "-",
        groupFile: group.file || "-",
        state: rule.state || "unknown",
        name: rule.name || "-",
        query: rule.query || "",
        duration: Number(rule.duration || 0),
        keepFiringFor: Number(rule.keepFiringFor || 0),
        severity,
        summary,
        description,
        health: rule.health || "unknown",
        type: rule.type || "-",
        lastEvaluation: rule.lastEvaluation || "-",
        alertsCount: Array.isArray(rule.alerts) ? rule.alerts.length : 0,
      });
    });
  });

  return rows;
}

export function groupRowsByGroup(rows: AlertRuleRow[]): Record<string, AlertRuleRow[]> {
  return rows.reduce<Record<string, AlertRuleRow[]>>((acc, row) => {
    if (!acc[row.groupName]) {
      acc[row.groupName] = [];
    }
    acc[row.groupName].push(row);
    return acc;
  }, {});
}
