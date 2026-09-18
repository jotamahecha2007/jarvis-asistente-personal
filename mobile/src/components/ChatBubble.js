import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, layout, typography } from "../theme/theme";

const AGENT_LABELS = {
  add_transaction: "Finanzas",
  list_transactions: "Finanzas",
  get_balance_and_cashflow: "Finanzas",
  register_credit_card: "Finanzas",
  list_credit_cards: "Finanzas",
  create_savings_goal: "Finanzas",
  contribute_to_goal: "Finanzas",
  list_savings_goals: "Finanzas",
  create_task: "Secretaría",
  list_tasks: "Secretaría",
  update_task_status: "Secretaría",
  check_emails: "Secretaría",
  draft_email: "Secretaría",
};

export default function ChatBubble({ role, content, toolsUsed }) {
  const isUser = role === "user";
  const agents = [...new Set((toolsUsed || []).map((t) => AGENT_LABELS[t]).filter(Boolean))];

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Text style={[styles.label, isUser ? styles.labelUser : styles.labelAssistant]}>
        {isUser ? "TU" : "JARVIS"}
      </Text>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={styles.text}>{content}</Text>
      </View>
      {agents.length > 0 ? (
        <View style={styles.badgeRow}>
          {agents.map((a) => (
            <View key={a} style={styles.badge}>
              <Text style={styles.badgeText}>⚙ {a}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6, maxWidth: "86%" },
  rowUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowAssistant: { alignSelf: "flex-start", alignItems: "flex-start" },
  label: { ...typography.mono, fontSize: 10, marginBottom: 3, opacity: 0.8 },
  labelUser: { color: colors.amber },
  labelAssistant: { color: colors.cyan },
  bubble: {
    borderRadius: layout.radius,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexShrink: 1,
    alignSelf: "stretch",
  },
  bubbleUser: { backgroundColor: "rgba(255,176,39,0.08)", borderColor: "rgba(255,176,39,0.4)" },
  bubbleAssistant: { backgroundColor: "rgba(47,227,255,0.06)", borderColor: colors.border },
  text: { color: colors.textPrimary, fontSize: 15, lineHeight: 21, flexShrink: 1, flexWrap: "wrap" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  badge: {
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { ...typography.mono, fontSize: 9, color: colors.cyan },
});