// src/screens/Mypage/MypageScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator"; // 경로 수정 필요
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import EaterMypage from "./EaterMypage";
import MakerMypage from "./MakerMypage";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

// Navigation Props 타입 정의
type Props = NativeStackScreenProps<AuthStackParamList, "MypageScreen">;

export default function MypageScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();

  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";
  const isEater = isLoggedIn && userRole === "EATER";
  // 사용자 역할을 어떻게 가져올지에 따라 다음 중 하나를 선택:
  // 1. route params에서 가져오기 (추천)
  // const userRole = route.params?.userRole || "eater";

  // 2. 전역 상태나 Context에서 가져오기 (추천)
  // const { userRole } = useUserContext();

  // 3. AsyncStorage나 다른 저장소에서 가져오기
  // const [userRole, setUserRole] = useState<"eater" | "maker">("eater");

  // 임시로 기본값 설정 (실제로는 위의 방법 중 하나 사용)

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const primaryColor = isEater ? COLORS.primaryEater : COLORS.primaryMaker;

 

  // 로그아웃 핸들러
  const handleLogout = () => {
    // 로그아웃 로직 수행 (토큰 삭제, 상태 초기화 등)
    // ...로그아웃 로직...

    // 로그인 화면으로 이동
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      {/* 헤더 - 조건부 렌더링 */}
      {isHeaderVisible && (
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.hamburgerButton}>
            {/* 햄버거 아이콘 */}
            <HamburgerButton
              userRole={isMaker ? "maker" : "eater"}
              onMypage={() => {}}
            />
          </TouchableOpacity>
          {/* 로고 */}
          <HeaderLogo />
        </View>
      )}

      <SafeAreaView
        style={[styles.content, { paddingVertical: height * 0.02 }]}
        pointerEvents="box-none"
      >
        {/* 마이페이지 컨텐츠 */}
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {isEater ? (
            <EaterMypage
              onLogout={handleLogout}
              setHeaderVisible={setIsHeaderVisible}
            />
          ) : (
            <MakerMypage
              onLogout={handleLogout}
              setHeaderVisible={setIsHeaderVisible}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  hamburgerButton: {
    zIndex: 1,
  },
});
