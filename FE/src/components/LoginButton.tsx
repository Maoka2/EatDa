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
          { backgroundColor, height: hp(0.055), borderRadius: wp(0.02) },
          style,
        ]}
        onPress={onPress}
      >
        {icon && (
          <Image source={icon} style={[{ marginRight: wp(0.02) }, iconStyle]} />
        )}
        <Text style={[styles.text, { fontSize: wp(0.04) }, textStyle]}>
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
  text: { color: "#fff", fontWeight: "600" },
});
