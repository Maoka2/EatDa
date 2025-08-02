// src/components/Hamburger.tsx
// 햄버거 버튼 따로 컴포넌트로 빼놓으면 좋을거같아서 늦었지만 해보았습니다.

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  onPress: () => void;
}

export default function HamburgerButton({ onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.icon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingTop: 4,
    marginTop:3,
  },
});