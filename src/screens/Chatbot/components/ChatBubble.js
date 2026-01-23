import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles/chatStyles";

export default function ChatBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAI,
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAI,
          ]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
