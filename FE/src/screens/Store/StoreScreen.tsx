// src/screens/Store/StoreScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import TabSwitcher from "../../components/TabSwitcher";
import BottomButton from "../../components/BottomButton";

import StoreMenuScreen from "./StoreMenuScreen";
import StoreEventScreen from "./StoreEventScreen";
import StoreReviewScreen from "./StoreReviewScreen";
import { useAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";


type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "StoreScreen"
>;
type StoreRouteProp = RouteProp<AuthStackParamList, "StoreScreen">;

export default function StoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreRouteProp>();
  const storeId = route?.params?.storeId;
  const storeName = route?.params?.storeName;
  const address = route?.params?.address;
  const latitude = route?.params?.latitude;
  const longitude = route?.params?.longitude;

  const { isLoggedIn, userRole } = useAuth();
  const isEater = isLoggedIn && userRole === "EATER";

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    if (!storeId || storeId <= 0) {
      console.warn("[StoreScreen] invalid storeId:", storeId);
    }
  }, [storeId]);

  if (!storeId || storeId <= 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F8F9",
        }}
      >
        <Text style={{ color: "#666" }}>유효한 가게 ID가 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "event", label: "가게 이벤트" },
    { key: "review", label: "리뷰" },
  ];

  useEffect(() => {
    AsyncStorage.getItem("accessToken").then((token) => {
      setAccessToken(token);
    });
  }, []);

  // ✅ 하단 버튼 핸들링: BottomButton에서 넘어온 키를 스위치로 처리
  const handleBottomPress = (screen: string) => {
    switch (screen) {
      case "review":
        navigation.navigate("ReviewWriteScreen");
        break;
      case "map":
        navigation.navigate("MapScreen"); // 필요시 store 좌표 넘기면 더 좋음
        // navigation.navigate("MapScreen", { storeId, storeName, latitude, longitude });
        break;
      case "menu":
        navigation.navigate("MenuCustomScreen", {
          storeId,
          storeName,
          address,
        });
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#F7F8F9", flex: 1 }}>
      <View style={styles.headerContainer}>
        <HamburgerButton userRole="eater" onMypage={() => {}} />
        <HeaderLogo />
      </View>

      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{storeName || "가게 이름"}</Text>
        <Text style={styles.storeAddress}>
          {address ? `📍${address}` : "📍주소 정보 없음"}
        </Text>
      </View>

      <TabSwitcher tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      <View style={{ flex: 1 }}>
        {activeTab === "menu" && accessToken &&  (<StoreMenuScreen storeId={storeId} accessToken={accessToken}/>)}
        {activeTab === "event" && <StoreEventScreen />}
        {activeTab === "review" && <StoreReviewScreen />}
      </View>

      {isEater && <BottomButton onPress={handleBottomPress} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", paddingTop: 40 },
  storeInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  storeName: { fontSize: 20, fontWeight: "500", marginRight: 12 },
  storeAddress: { marginTop: 9, fontSize: 12, letterSpacing: -0.3 },
});
