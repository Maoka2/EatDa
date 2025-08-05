// src/components/LoadingSpinner.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
}

export default function LoadingSpinner({
  message = "메뉴판을 생성중입니다...",
  size = "large",
  color = "#53A3DA",
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        <Text style={styles.message}>{message}</Text>
        <View style={styles.sparkle}>✨</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  } as ViewStyle,
  content: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  } as TextStyle,
  sparkle: {
    position: "absolute",
    top: -10,
    right: -10,
    fontSize: 24,
  } as ViewStyle,
});
