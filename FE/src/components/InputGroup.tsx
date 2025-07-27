import React from "react";
import { View, Text, StyleSheet, TextInputProps } from "react-native";
import CustomInput from "./CustomInput";
import { COLORS } from "../constants/theme";
import { useResponsive } from "../utils/useResponsive";

interface Props extends TextInputProps {
  label: string;
}

export default function InputGroup({ label, style, ...inputProps }: Props) {
  const { hp, wp } = useResponsive();
  return (
    <View style={{ marginBottom: hp(0.02) }}>
      {label ? (
        <Text
          style={[
            styles.label,
            { fontSize: wp(0.035), marginBottom: hp(0.015) },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <CustomInput {...inputProps} style={style} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: COLORS.text, fontWeight: "500" },
});
