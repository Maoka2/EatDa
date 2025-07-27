import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { Shadow } from "react-native-shadow-2";
import { useResponsive } from "../utils/useResponsive";

interface Props extends TextInputProps {
  style?: any;
}

export default function CustomInput({ style, ...props }: Props) {
  const { hp, wp } = useResponsive();
  return (
    <Shadow
      offset={[0, hp(0.005)]}
      distance={hp(0.01)}
      startColor="rgba(0,0,0,0.1)"
      style={styles.shadowContainer}
    >
      <TextInput
        style={[
          styles.input,
          { height: hp(0.065), paddingHorizontal: wp(0.04) },
          style,
        ]}
        placeholderTextColor="#aaa"
        {...props}
      />
    </Shadow>
  );
}

const styles = StyleSheet.create({
  shadowContainer: { width: "100%", borderRadius: 8, overflow: "visible" },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    fontSize: 14,
    borderRadius: 10,
  },
});
