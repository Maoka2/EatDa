// src/screens/Login/EaterLoginScreen.tsx
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import AuthForm, { AuthField } from "../../components/AuthForm";
import SocialLoginBtn from "../../components/SocialLoginBtn";
import GoogleIcon from "../../../assets/google-icon.svg";
import KakaoIcon from "../../../assets/kakao-icon.svg";
import { ApiError, signIn } from "./services/api";
import { saveTokens } from "./services/tokenStorage";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "EaterLoginScreen"
>;

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

// Props를 optional로 변경
type Props = {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
  onLoginFailure?: (message: string) => void;
};

export default function EaterLoginScreen(props?: Props) {
  const navigation = useNavigation<NavigationProp>();

  const [isLoading, setIsLoading] = useState(false);

  const handleNavigateToRegister = () => {
    // 역할 선택 화면으로 먼저 이동
    navigation.navigate("RoleSelectionScreen");
  };

  const handleLoginSuccess = () => {
    navigation.navigate("ReviewTabScreen"); // 또는 메인 화면
  };

  const handleLoginFailure = (message: string) => {
    console.error("Eater login failed:", message);
    // 에러 처리 로직 (예: Alert 표시)
  };

  // props가 있으면 props 함수 사용, 없으면 내장 함수 사용
  const navigateToRegister =
    props?.onNavigateToRegister || handleNavigateToRegister;
  const loginSuccess = props?.onLoginSuccess || handleLoginSuccess;
  const loginFailure = props?.onLoginFailure || handleLoginFailure;

  const handleLinkPress = (item: string) => {
    console.log(`${item} 클릭됨`);
    if (item === "회원가입") {
      navigateToRegister();
    } else if (item === "아이디 찾기") {
      // 아이디 찾기 로직 - 추후 화면 추가시 네비게이션
      console.log("아이디 찾기 화면으로 이동");
      // navigation.navigate('FindIdScreen');
    } else if (item === "비밀번호 찾기") {
      // 비밀번호 찾기 로직 - 추후 화면 추가시 네비게이션
      console.log("비밀번호 찾기 화면으로 이동");
      // navigation.navigate('FindPasswordScreen');
    }
  };

  const handleLogin = async (formData: Record<string, string>) => {
    console.log("냠냠이 로그인 처리", formData);

    // 간단한 유효성 검사, AuthForm 에서 진행하고 있어서 일단 주석처리 했습니다.
    // if (!formData.email || !formData.password) {
    //   loginFailure("이메일과 비밀번호를 모두 입력해주세요.");
    //   return;
    // }

    // 실제 로그인 API 호출을 시뮬레이션

    try {
      setIsLoading(true);

      const response = await signIn({
        email: formData.email,
        password: formData.password,
        role: "EATER",
      });

      console.log(`로그인 성공 [${response.status}]:`, response);

      // 밑에 토큰 저장코드 추가
      await saveTokens(response.data);

      loginSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(
          `로그인 실패(API ERROR) [${error.status}]:`,
          error.message
        );
        loginFailure(error.message);
      } else {
        console.log("로그인 실패(Unknown ERROR) :", error);
        loginFailure(
          "알 수 없는 오류로 인한 로그인 실패 발생. 네트워크 상태를 확인해주세요."
        );
      }
    } finally {
      setIsLoading(false);
    }
    // 여기서는 간단한 검증으로 대체, AuthForm 에서 검증하고 있어서 일단 주석처리 했습니다.
    // setTimeout(() => {
    //   // 더미 검증: 이메일에 '@'가 있고 비밀번호가 4자 이상이면 성공
    //   if (formData.email.includes("@") && formData.password.length >= 4) {
    //     loginSuccess();
    //   } else {
    //     loginFailure("이메일 또는 비밀번호가 올바르지 않습니다.");
    //   }
    // }, 1000);
  };

  const handleGoogleLogin = () => {
    console.log("구글 로그인 처리");
    // 구글 로그인 시뮬레이션
    setTimeout(() => {
      loginSuccess();
    }, 1000);
  };

  const handleKakaoLogin = () => {
    console.log("카카오 로그인 처리");
    // 카카오 로그인 시뮬레이션
    setTimeout(() => {
      loginSuccess();
    }, 1000);
  };

  return (
    <AuthForm
      role="eater"
      fields={loginFields}
      onSubmit={handleLogin}
      submitButtonText={isLoading ? "로그인 중..." : "로그인"}
      linkItems={linkItems}
      onLinkPress={handleLinkPress}
      showLinks={true}
    >
      <SocialLoginBtn
        title="구글 로그인"
        onPress={handleGoogleLogin}
        IconComponent={GoogleIcon}
        style={{ backgroundColor: "#fff" }}
        iconStyle={{ width: 14, height: 14 }}
      />
      <SocialLoginBtn
        title="카카오 로그인"
        onPress={handleKakaoLogin}
        IconComponent={KakaoIcon}
        style={{ backgroundColor: "#FEE500" }}
        iconStyle={{ width: 14, height: 14 }}
      />
    </AuthForm>
  );
}
