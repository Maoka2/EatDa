// src/components/AuthForm.tsx
import React from "react";
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import CustomInput from "./CustomInput";
import LoginButton from "./LoginButton";
import InputGroup from "./InputGroup";
import { SPACING, COLORS } from "../constants/theme";

export type AuthField = {
  key: string;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
};

type Props = {
  role: "eater" | "maker";
  fields: AuthField[];
  onSubmit: () => void;
  submitButtonText: string;
  linkItems?: string[];
  onLinkPress?: (item: string) => void;
  children?: React.ReactNode;
  showLinks?: boolean;
};

export default function AuthForm({
  role,
  fields,
  onSubmit,
  submitButtonText,
  linkItems = [],
  onLinkPress,
  children,
  showLinks = true,
}: Props) {
  const { width, height } = useWindowDimensions();
  const btnHeight = height * 0.055; // 0.065에서 0.055로 줄임

  return (
    <View style={[styles.container, { paddingHorizontal: width * 0.04 }]}>
      {/* 입력 필드들 */}
      {fields.map((field) => (
        <InputGroup
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          secureTextEntry={field.secureTextEntry || false}
          keyboardType={field.keyboardType || "default"}
          style={{
            height: btnHeight,
            paddingHorizontal: width * 0.04,
          }}
        />
      ))}

      {/* 링크들 (로그인 화면에서만 표시) */}
      {showLinks && linkItems.length > 0 && (
        <View style={styles.linkRow}>
          {linkItems.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <Text style={styles.separator}>|</Text>}
              <Text style={styles.link} onPress={() => onLinkPress?.(item)}>
                {item}
              </Text>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* 메인 버튼 */}
      <LoginButton
        title={submitButtonText}
        role={role}
        onPress={onSubmit}
        style={{
          height: btnHeight,
          borderRadius: width * 0.02,
          marginBottom: height * 0.02, // 0.025에서 0.02로 줄임
        }}
        textStyle={{ fontSize: width * 0.04 }}
      />

      {/* 추가 버튼들 (소셜 로그인 등) */}
      {children && (
        <View style={styles.childrenContainer}>
          {React.Children.toArray(children).map((child, idx, arr) => (
            <View
              key={idx}
              style={[
                styles.childItem,
                { marginRight: idx === arr.length - 1 ? 0 : width * 0.03 }, // 0.02에서 0.03으로 증가
              ]}
            >
              {child}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  separator: {
    marginHorizontal: SPACING.sm,
    color: COLORS.inactive,
    fontSize: 12,
  },
  link: {
    fontSize: 12,
    color: COLORS.inactive,
  },
  childrenContainer: {
    flexDirection: "row",
  },
  childItem: {
    flex: 1,
  },
});
