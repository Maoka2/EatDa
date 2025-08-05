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

import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import TabSwitcher from "../../components/TabSwitcher";
import BottomButton from "../../components/BottomButton";

import StoreMenuScreen from "./StoreMenuScreen";
import StoreEventScreen from "./StoreEventScreen";
import StoreReviewScreen from "./StoreReviewScreen";
import ReviewWriteScreen from "./Review/ReviewWriteScreen";
import MapScreen from "./Map/MapScreen";
import MenuCustomScreen from "./Menu/MenuCustomScreen";

// 새로 추가할 하단 버튼 화면들

interface StoreProps {
  onGoBack: () => void;
}

export default function StoreScreen({ onGoBack }: StoreProps) {
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

  // 하단 버튼 화면이 활성화된 경우 해당 화면 렌더링
  if (bottomActiveScreen) {
    switch (bottomActiveScreen) {
      case "review":
        return <ReviewWriteScreen onClose={handleCloseBottomScreen} />;
      case "map":
        return <MapScreen onClose={handleCloseBottomScreen} />;
      case "menu":
        return <MenuCustomScreen onClose={handleCloseBottomScreen} />;
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={[{ backgroundColor: "#F7F8F9", flex: 1 }]}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole="eater"
          onLogout={() => {
            console.log("로그아웃");
          }}
          activePage="storePage"
        />
        <HeaderLogo />
        <TouchableOpacity
          onPress={onGoBack}
          style={{
            padding: 10,
            alignSelf: "flex-end",
            marginRight: 20,
            marginTop: 10,
            backgroundColor: "#eee",
            borderRadius: 8,
          }}
        >
          <Text>뒤로가기</Text>
        </TouchableOpacity>
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
});
