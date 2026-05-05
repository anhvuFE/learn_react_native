import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  todoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#64748b",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#7c3aed",
    borderColor: "#a78bfa",
  },
  checkMark: { color: "#fff", fontWeight: "800", fontSize: 14 },
  todoText: { flex: 1, color: "#f8fafc", fontSize: 16 },
  todoTextDone: { color: "#64748b", textDecorationLine: "line-through" },
});
