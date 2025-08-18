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
import { saveAuth, getAuth, hasTokens, Role } from "./services/tokenStorage";
import { useAuth } from "../../contexts/AuthContext";
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

  const { login } = useAuth();

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
      console.log("아이디 찾기 화면으로 이동");
      // navigation.navigate('FindIdScreen');
    } else if (item === "비밀번호 찾기") {
      console.log("비밀번호 찾기 화면으로 이동");
      // navigation.navigate('FindPasswordScreen');
    }
  };

  const handleLogin = async (formData: Record<string, string>) => {
    console.log("냠냠이 로그인 처리", formData);

    try {
      setIsLoading(true);

      const response = await signIn({
        email: formData.email,
        password: formData.password,
        role: "EATER",
      });

      console.log(`로그인 성공 [${response.status}]:`, response);

      // 토큰 + 역할 동시 저장
      const role: Role = "EATER";
      await saveAuth(response.data, role);

      login(role);
      // 저장 확인 (콘솔)
      const ok = await hasTokens();
      const auth = await getAuth();
      console.log("[EATER] 저장 확인 ok:", ok, "auth:", auth);

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
  };

  const handleGoogleLogin = () => {
    console.log("구글 로그인 처리");
    // 백엔드 미구현: 더미 성공 시뮬
    // setTimeout(() => loginSuccess(), 1000);
  };

  const handleKakaoLogin = () => {
    console.log("카카오 로그인 처리");
    // 백엔드 미구현: 더미 성공 시뮬
    // setTimeout(() => loginSuccess(), 1000);
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
      {/* <SocialLoginBtn
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
      /> */}
    </AuthForm>
  );
}
