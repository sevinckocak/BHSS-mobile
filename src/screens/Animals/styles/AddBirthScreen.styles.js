import { StyleSheet, Platform } from "react-native";

export const COLORS = {
  bg: "#070A18",
  gold: "#F2D08A",
  stroke: "rgba(217,179,107,0.55)",
  card: "rgba(255,255,255,0.06)",
};

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  headerTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  photoCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 18,
  },

  photoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  photoBtn: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.6,
    borderColor: "rgba(242,208,138,0.55)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  photoInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.6,
    borderColor: "rgba(242,208,138,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  photoCore: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  photoImg: {
    width: "100%",
    height: "100%",
  },

  cameraBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(242,208,138,0.55)",
    backgroundColor: "#0B1026",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  fieldWrap: {
    width: "48%",
    marginBottom: 10,
  },

  input: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: COLORS.stroke,
    paddingHorizontal: 14,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  selectPill: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: COLORS.stroke,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 10,
    flex: 1,
  },

  accordionBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 10,
  },

  accordionText: {
    color: "white",
    fontWeight: "800",
  },

  twinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },

  twinText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },

  addBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.stroke,
    backgroundColor: "rgba(217,179,107,0.14)",
  },

  addBtnText: {
    color: COLORS.gold,
    fontWeight: "900",
    fontSize: 16,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  modalPortal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    maxHeight: "70%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(217,179,107,0.35)",
    backgroundColor: "#03071a",
    padding: 14,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  modalTitle: {
    color: COLORS.gold,
    fontWeight: "900",
    fontSize: 14,
  },

  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  modalItemText: {
    color: "white",
    fontWeight: "800",
  },

  modalItemSub: {
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
    fontSize: 12,
  },

  pickerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B1026",
  },
});
