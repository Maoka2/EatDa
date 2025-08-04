// src/screens/Store/StroeScreen.tsx
// 헤더(햄버거, 로고) -> 주소 -> 탭스위치 -> 누른거에 따라 Store(Event/Menu/Review) Screen 불러오기 -> 맨밑 버튼 3개

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableWithoutFeedback,
  Keyboard,
  ViewStyle,
  TextStyle,
} from "react-native";

import HamburgerButton from "../../components/Hamburger";
import Sidebar from "../../components/Sidebar";
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

interface StoreProps {
  //   storeId: string;
  //   storeName: string;
  //   storeAddress: string;
  // { storeId, storeName, storeAddress }: StoreProps
}

export default function StoreScreen() {
  // 탭스위쳐 관리
  const [activeTab, setActiveTab] = useState("menu");

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "event", label: "가게 이벤트" },
    { key: "review", label: "리뷰" },
  ];

  return (
    //  아래에서 부터 화면 구성 코드
    <SafeAreaView style={[{ backgroundColor: "#F7F8F9", flex: 1 }]}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        {/* 햄버거 버튼 */}
        <HamburgerButton
          userRole="eater"
          onLogout={() => {
            console.log("로그아웃");
          }}
          activePage="storePage"
        ></HamburgerButton>
        {/* 헤더 로고 */}
        <HeaderLogo></HeaderLogo>
      </View>

      {/* 가게정보 파트 */}
      <View style={styles.storeInfo}>
        {/* 가게명 */}
        <Text style={styles.storeName}>햄찌네 피자</Text>
        {/* <Text style={styles.storeName}>{storeName}</Text> */}
        {/* 가게 주소 */}
        <Text style={styles.storeAddress}>
          📍서울특별시 강남구 테헤란로 212
        </Text>
        {/* <Text style={styles.storeAddress}>{storeAddress}</Text> */}
      </View>

      {/* 탭스위치 */}
      <TabSwitcher
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
        }}
      ></TabSwitcher>
      <View style={{ flex: 1 }}>
        {/* 활성화 탭에 따라 화면 가져오기 */}
        {activeTab === "menu" && <StoreMenuScreen></StoreMenuScreen>}
        {activeTab === "event" && <StoreEventScreen></StoreEventScreen>}
        {activeTab === "review" && <StoreReviewScreen></StoreReviewScreen>}
      </View>

      {/* 메뉴판 스타일 탭, 메뉴 볼 때만 활성화 되도록 */}
      {activeTab === "menu" && (
        <View style={styles.menuStyleContainer}>
          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy1></MenuStyleDummy1>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy2></MenuStyleDummy2>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy3></MenuStyleDummy3>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy4></MenuStyleDummy4>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuStyleBtn}>
            <MenuStyleDummy5></MenuStyleDummy5>
          </TouchableOpacity>
        </View>
      )}
      {/* 하단 버튼 3개 */}
      <BottomButton></BottomButton>
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
    fontWeight: 500,
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
