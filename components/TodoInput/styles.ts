import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    color: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#a78bfa",
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 32,
  },
});
