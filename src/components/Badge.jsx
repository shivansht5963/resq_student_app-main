import React from "react";
import { View, Text, StyleSheet } from "react-native";

const statusConfig = {
  REPORTED: { label: "Reported", color: "#F59E0B", bg: "#FEF3C7" },
  ASSIGNED: { label: "Assigned", color: "#3B82F6", bg: "#DBEAFE" },
  RESPONDED: { label: "Responded", color: "#8B5CF6", bg: "#EDE9FE" },
  CLOSED: { label: "Closed", color: "#10B981", bg: "#D1FAE5" },
};

export default function Badge({ status, style }) {
  const config = statusConfig[status] || statusConfig.REPORTED;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
