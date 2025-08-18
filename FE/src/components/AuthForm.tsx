// src/components/AuthForm.tsx
import React, { useState } from "react";
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
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
  onSubmit: (formData: Record<string, string>) => void;
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
  const btnHeight = height * 0.055;

  // Login 인지 Register인지
  const loginKeys = ["email", "password"];
  const isLogin =
    fields.length === 2 && fields.every((f) => loginKeys.includes(f.key));

  // Form 데이터
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {};
    fields.forEach((field) => {
      initialData[field.key] = "";
    });
    return initialData;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // 유효성 검사
  const isEmailValid = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const isPasswordValid = (v: string) => v.length >= 8;

  // 필드별 에러 메시지
  const getFieldError = (key: string, value: string): string => {
    if (key === "email") {
      if (!value.trim()) return "이메일을 입력하세요.";
      if (!isEmailValid(value)) return "올바른 이메일 형식이 아닙니다.";
    }
    if (key === "password") {
      if (!value) return "비밀번호를 입력하세요.";
      // 기존 코드 메시지를 존중: 8자 이상
      if (!isPasswordValid(value)) return "비밀번호는 8자 이상이어야 합니다.";
    }
    return "";
  };

  // 로그인 -> 로그인버튼 누르기 전까지 안나옴, 회원가입의 경우 가입하기 누르거나 필드에 입력할 때 생기게
  const shouldShowError = (key: string) => {
    if (isLogin) {
      return submitted;
    }
    return submitted || !!touched[key];
  };

  // 입력값 변경
  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    // 회원가입 쪽은 만지면 touched 처리
    if (!isLogin && !touched[key]) {
      setTouched((prev) => ({ ...prev, [key]: true }));
    }
  };

  // 가입하기 누를 시
  const handleSubmit = () => {
    setSubmitted(true);

    // 전체 유효성체크
    const errors: Record<string, string> = {};
    for (const f of fields) {
      const msg = getFieldError(f.key, formData[f.key] ?? "");
      if (msg) errors[f.key] = msg;
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <View style={[styles.container, { paddingHorizontal: width * 0.04 }]}>
      {/* 입력 필드들 */}
      {fields.map((field) => {
        const value = formData[field.key] ?? "";
        const errorMsg = getFieldError(field.key, value);
        const show = shouldShowError(field.key);
        // show가 false면 validation 비워서 InputGroup이 아무 것도 표시하지 않도록
        const validationText = show ? errorMsg : "";

        return (
          <InputGroup
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            secureTextEntry={field.secureTextEntry || false}
            keyboardType={field.keyboardType || "default"}
            value={value}
            onChangeText={(v) => handleInputChange(field.key, v)}
            style={{
              height: btnHeight,
              paddingHorizontal: width * 0.04,
            }}
            validation={validationText}
          />
        );
      })}

      {/* 링크들 (로그인 화면에서만 표시 가능) */}
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
        onPress={handleSubmit}
        style={{
          height: btnHeight,
          borderRadius: width * 0.02,
          marginBottom: height * 0.02,
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
                { marginRight: idx === arr.length - 1 ? 0 : width * 0.03 },
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
