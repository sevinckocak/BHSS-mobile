import { Dimensions } from "react-native";

export const { width: W } = Dimensions.get("window");

export const COLORS = {
  bg: "#050914",
  bg2: "#070B12",
  text: "#EAF4FF",
  muted: "rgba(234,244,255,0.55)",
  bubbleAI: "rgba(255,255,255,0.08)",
  bubbleAIBorder: "rgba(255,255,255,0.10)",
  bubbleUser: "#FFB15A",
  inputBg: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.10)",
  orange: "#FFB15A",
  orange2: "#FFCC72",
  drawerBg: "rgba(7,11,18,0.96)",
  drawerBorder: "rgba(255,255,255,0.08)",
};

export const TABBAR_H = 70;
export const INPUT_H = 64;

// ✅ Render URL
export const API_BASE = "https://bhss-chat-backend.onrender.com";
export const CHAT_ENDPOINT = `${API_BASE}/chat`;
