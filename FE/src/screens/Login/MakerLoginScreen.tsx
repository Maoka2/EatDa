// src/screens/Login/MakerLoginScreen.tsx
import React from "react";
import AuthForm, { AuthField } from "../../components/AuthForm";

const loginFields: AuthField[] = [
  {
    key: "email",
    label: "이메일",
    placeholder: "이메일을 입력해주세요",
    keyboardType: "email-address",
  },
  {
    key: "password",
    label: "비밀번호",
    placeholder: "비밀번호를 입력해주세요",
    secureTextEntry: true,
  },
];

const linkItems = ["아이디 찾기", "비밀번호 찾기", "회원가입"];

type Props = {
  onNavigateToRegister?: () => void;
  onLoginSuccess: () => void;
  onLoginFailure: (message: string) => void;
};

export default function MakerLoginScreen({
  onNavigateToRegister,
  onLoginSuccess,
  onLoginFailure,
}: Props) {
  const handleLinkPress = (item: string) => {
    console.log(`${item} 클릭됨`);
    if (item === "회원가입" && onNavigateToRegister) {
      onNavigateToRegister();
    } else if (item === "아이디 찾기") {
      // 아이디 찾기 로직
      console.log("아이디 찾기 화면으로 이동");
    } else if (item === "비밀번호 찾기") {
      // 비밀번호 찾기 로직
      console.log("비밀번호 찾기 화면으로 이동");
    }
  };

  const handleLogin = (formData: Record<string, string>) => {
    console.log("사장님 로그인 처리", formData);

    // 간단한 유효성 검사
    if (!formData.email || !formData.password) {
      onLoginFailure("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 실제 로그인 API 호출을 시뮬레이션
    // 여기서는 간단한 검증으로 대체
    setTimeout(() => {
      // 더미 검증: 이메일에 '@'가 있고 비밀번호가 4자 이상이면 성공
      if (formData.email.includes("@") && formData.password.length >= 4) {
        onLoginSuccess();
      } else {
        onLoginFailure("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    }, 1000);
  };

  return (
    <AuthForm
      role="maker"
      fields={loginFields}
      onSubmit={handleLogin}
      submitButtonText="로그인"
      linkItems={linkItems}
      onLinkPress={handleLinkPress}
      showLinks={true}
    />
  );
}
