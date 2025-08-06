// src/screens/Register/RegisterScreen.tsx
import React, { useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

// Navigation Props 타입 정의
type Props = NativeStackScreenProps<AuthStackParamList, "RegisterScreen">;

export default function RegisterScreen({ navigation, route }: Props) {
  // route params에서 역할 정보 가져오기 (기본값: eater)
  const role = route.params?.role || "eater";

  useEffect(() => {
    // 컴포넌트가 마운트되면 바로 해당 역할의 회원가입 화면으로 이동
    if (role === "eater") {
      navigation.replace("EaterRegisterScreen");
    } else {
      navigation.replace("MakerRegisterScreen");
    }
  }, [navigation, role]);

  // 로딩 상태나 빈 화면 반환 (실제로는 바로 다른 화면으로 이동하므로 보이지 않음)
  return null;
}
