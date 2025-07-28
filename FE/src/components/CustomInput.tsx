// src/components/CustomInput.tsx
import React from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  useWindowDimensions,
} from "react-native";
import { Shadow } from "react-native-shadow-2";

interface Props extends TextInputProps {
  style?: any;
}

export default function CustomInput({ style, ...props }: Props) {
  const { width } = useWindowDimensions();

  // 최소/최대값을 설정하여 극단적인 크기 방지
  const inputHeight = Math.max(45, Math.min(width * 0.12, 55)); // 최소 45px, 최대 55px
  const horizontalPadding = Math.max(15, Math.min(width * 0.04, 25)); // 최소 15px, 최대 25px
  const shadowOffset = Math.max(1, width * 0.002); // 최소 1px
  const shadowDistance = Math.max(2, width * 0.005); // 최소 2px
  const fontSize = Math.max(10, Math.min(width * 0.03, 14));

  return (
    <Shadow
      offset={[0, shadowOffset]}
      distance={shadowDistance}
      startColor="rgba(0,0,0,0.1)"
      style={styles.shadowContainer}
    >
      <TextInput
        style={[
          styles.input,
          {
            height: inputHeight,
            paddingHorizontal: horizontalPadding,
            paddingVertical: 0, // 세로 패딩 제거
            fontSize: fontSize,
            textAlignVertical: "center", // Android 텍스트 세로 가운데 정렬
          },
          style,
        ]}
        placeholderTextColor="#aaa"
        {...props}
      />
    </Shadow>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "visible",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    textAlignVertical: "center", // Android 전역 설정
  },
});
