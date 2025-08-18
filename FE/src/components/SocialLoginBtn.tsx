// src/components/SocialLoginBtn.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Shadow } from "react-native-shadow-2";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { SvgProps } from "react-native-svg";

interface Props {
  title: string;
  IconComponent: React.FC<SvgProps>;
  onPress: () => void;
  style?: any;
  iconStyle?: { width: number; height: number };
  textStyle?: any; // Text 스타일 추가 prop
}

export default function SocialLoginBtn({
  title,
  onPress,
  IconComponent,
  style,
  iconStyle,
  textStyle = {},
}: Props) {
  const { width } = useWindowDimensions();

  // 버튼 높이 (가로폭의 12%)
  const btnHeight = width * 0.1;
  // 폰트 크기: 가로폭의 3% 기준, 최소 10, 최대 14
  const fontSize = Math.max(10, Math.min(width * 0.03, 14));
  // 카카오일 땐 진한 텍스트 컬러
  const textColor = title.includes("카카오") ? "#333" : COLORS.text;

  return (
    <Shadow
      offset={[0, 2]}
      distance={4}
      startColor="rgba(0,0,0,0.1)"
      style={styles.shadowContainer}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.button, { height: btnHeight }, style]}
      >
        <IconComponent
          width={iconStyle?.width || 18}
          height={iconStyle?.height || 18}
          style={styles.icon}
        />
        <Text
          style={[
            styles.text,
            { fontSize, color: textColor },
            textStyle, // 외부에서 추가 스타일 가능
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Shadow>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    width: "100%",
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    width: "100%",
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
