// src/components/HeaderLogo.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS, textStyles } from "../constants/theme";

export default function HeaderLogo() {
  return (
    <Text style={[textStyles.logo, styles.logo]}>
      <Text style={{ color: COLORS.primaryEater }}>E</Text>
      <Text style={{ color: COLORS.textColors.primary }}>at</Text>
      <Text style={{ color: COLORS.primaryMaker }}>D</Text>
      <Text style={{ color: COLORS.textColors.primary }}>a</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 24,
  },
});