import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CustomInput from "../components/CustomInput";
import LoginButton from "../components/LoginButton";
import { useResponsive } from "../utils/useResponsive";

export default function LoginForm({
  role,
  onLogin,
  children,
}: {
  role: "eater" | "maker";
  onLogin: () => void;
  children?: React.ReactNode;
}) {
  const { hp, wp } = useResponsive();
  return (
    <View style={[styles.box, { paddingHorizontal: wp(0.04) }]}>
      <Text style={[{ marginBottom: hp(0.015), fontSize: wp(0.035) }]}>
        이메일
      </Text>
      <CustomInput
        placeholder="이메일을 입력해주세요"
        style={{ marginBottom: hp(0.02) }}
        keyboardType="email-address"
      />
      <Text style={[{ marginBottom: hp(0.015), fontSize: wp(0.035) }]}>
        비밀번호
      </Text>
      <CustomInput
        secureTextEntry
        placeholder="비밀번호를 입력해주세요"
        style={{ marginBottom: hp(0.02) }}
      />
      <LoginButton
        title="로그인"
        role={role}
        onPress={onLogin}
        style={{ marginBottom: hp(0.02) }}
      />
      <View style={{ flexDirection: "row" }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ box: { width: "100%" } });
