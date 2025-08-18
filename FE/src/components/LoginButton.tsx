// src/components/LoginButton.tsx
import React from "react";
import { TouchableOpacity, Text, Image, StyleSheet } from "react-native";
import { Shadow } from "react-native-shadow-2";
import { useResponsive } from "../utils/useResponsive";

interface Props {
  title: string;
  onPress: () => void;
  role?: "eater" | "maker";
  style?: any;
  textStyle?: any;
  icon?: any;
  iconStyle?: any;
}

export default function LoginButton({
  title,
  onPress,
  role = "eater",
  style,
  textStyle,
  icon,
  iconStyle,
}: Props) {
  const { hp, wp } = useResponsive();

  // 버튼 높이·반경은 기존대로
  const height = hp(0.055);
  const borderRadius = wp(0.02);

  // fontSize: 화면 너비의 4% 기준, 최소 12, 최대 16
  const fontSize = Math.max(12, Math.min(wp(0.04), 16));
  const color = "#fff";
  const backgroundColor = role === "maker" ? "#38CCA2" : "#53A3DA";

  return (
    <Shadow
      offset={[0, hp(0.005)]}
      distance={hp(0.01)}
      startColor="rgba(0,0,0,0.1)"
      style={styles.shadowContainer}
    >
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor, height, borderRadius },
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon && (
          <Image source={icon} style={[{ marginRight: wp(0.02) }, iconStyle]} />
        )}
        <Text style={[styles.text, { fontSize, color }, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Shadow>
  );
}

const styles = StyleSheet.create({
  shadowContainer: { width: "100%", borderRadius: 8 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
