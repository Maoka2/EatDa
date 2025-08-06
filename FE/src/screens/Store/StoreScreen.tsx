// src/screens/Store/StoreScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import TabSwitcher from "../../components/TabSwitcher";
import BottomButton from "../../components/BottomButton";

// 메뉴판 스타일 버튼 더미이미지
import MenuStyleDummy1 from "../../data/menuStyleDummy/menuStyleDummy1.svg";
import MenuStyleDummy2 from "../../data/menuStyleDummy/menuStyleDummy2.svg";
import MenuStyleDummy3 from "../../data/menuStyleDummy/menuStyleDummy3.svg";
import MenuStyleDummy4 from "../../data/menuStyleDummy/menuStyleDummy4.svg";
import MenuStyleDummy5 from "../../data/menuStyleDummy/menuStyleDummy5.svg";

import StoreMenuScreen from "./StoreMenuScreen";
import StoreEventScreen from "./StoreEventScreen";
import StoreReviewScreen from "./StoreReviewScreen";
import ReviewWriteScreen from "./Review/ReviewWriteScreen";
import MapScreen from "./Map/MapScreen";
import MenuCustomScreen from "./Menu/MenuCustomScreen";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "StoreScreen"
>;

interface StoreProps {
  onGoBack?: () => void;
}

export default function StoreScreen(props?: StoreProps) {
  const navigation = useNavigation<NavigationProp>();

  // 내장 네비게이션 함수들
  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleLogout = () => {
    navigation.navigate("Login");
  };

  const handleMypage = () => {
    console.log("마이페이지로 이동");
    // navigation.navigate('MyPageScreen'); // 실제 마이페이지 화면으로 변경
  };

  // props가 있으면 props 함수 사용, 없으면 내장 함수 사용
  const goBack = props?.onGoBack || handleGoBack;

  // 탭스위쳐 관리
  const [activeTab, setActiveTab] = useState("menu");
  // 하단 버튼 화면 관리
  const [bottomActiveScreen, setBottomActiveScreen] = useState<string | null>(
    null
  );

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "event", label: "가게 이벤트" },
    { key: "review", label: "리뷰" },
  ];

  // 하단 버튼 핸들러
  const handleBottomButtonPress = (screen: string) => {
    setBottomActiveScreen(screen);
  };

  const handleCloseBottomScreen = () => {
    setBottomActiveScreen(null);
  };

  // useEffect로 네비게이션 처리 (렌더링 중이 아닌 사이드 이펙트로 처리)
  useEffect(() => {
    if (bottomActiveScreen) {
      switch (bottomActiveScreen) {
        case "review":
          navigation.navigate("ReviewWriteScreen");
          break;
        case "map":
          navigation.navigate("MapScreen");
          break;
        case "menu":
          navigation.navigate("MenuCustomScreen");
          break;
      }
      // 상태 초기화
      setBottomActiveScreen(null);
    }
  }, [bottomActiveScreen, navigation]);

  return (
    <SafeAreaView style={[{ backgroundColor: "#F7F8F9", flex: 1 }]}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole="eater"
          onLogout={handleLogout}
          onMypage={handleMypage}
        />
        <HeaderLogo />
      </View>

      {/* 가게정보 파트 */}
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>햄찌네 피자</Text>
        <Text style={styles.storeAddress}>
          📍서울특별시 강남구 테헤란로 212
        </Text>
      </View>

      {/* 탭스위치 */}
      <TabSwitcher
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
        }}
      />

      <View style={{ flex: 1 }}>
        {/* 활성화 탭에 따라 화면 가져오기 */}
        {activeTab === "menu" && <StoreMenuScreen />}
        {activeTab === "event" && <StoreEventScreen />}
        {activeTab === "review" && <StoreReviewScreen />}
      </View>

      {/* 메뉴판 스타일 탭, 메뉴 볼 때만 활성화 되도록 */}
      {activeTab === "menu" && (
        <View style={styles.menuStyleContainer}>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy1 />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy2 />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy3 />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy4 />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy5 />
          </TouchableOpacity>
        </View>
      )}

      {/* 하단 버튼 3개 */}
      <BottomButton onPress={handleBottomButtonPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  storeInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 10,
  } as ViewStyle,
  storeName: {
    fontSize: 20,
    fontWeight: "500",
    marginRight: 12,
  } as TextStyle,
  storeAddress: {
    marginTop: 9,
    fontSize: 12,
    letterSpacing: -0.3,
  } as TextStyle,
  menuStyleContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  } as ViewStyle,
  menuStyleBtn: {
    flex: 1,
    alignItems: "center",
  } as ViewStyle,
});
