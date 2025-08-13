import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from "react-native";
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

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "StoreScreen"
>;
type StoreRouteProp = RouteProp<AuthStackParamList, "StoreScreen">;

export default function StoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreRouteProp>();
  const storeId = route?.params?.storeId;

  const { isLoggedIn, userRole } = useAuth();
  const isEater = isLoggedIn && userRole === "EATER";

  const [activeTab, setActiveTab] = useState("menu");
  const [bottomActiveScreen, setBottomActiveScreen] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!storeId || storeId <= 0) {
      console.warn("[StoreScreen] invalid storeId:", storeId);
    }
  }, [storeId]);

  useEffect(() => {
    if (!bottomActiveScreen) return;
    if (bottomActiveScreen === "review")
      navigation.navigate("ReviewWriteScreen");
    if (bottomActiveScreen === "map") navigation.navigate("MapScreen");
    if (bottomActiveScreen === "menu") navigation.navigate("MenuCustomScreen");
    setBottomActiveScreen(null);
  }, [bottomActiveScreen, navigation]);

  if (!storeId || storeId <= 0) {
    return (
      <SafeAreaView
        style={{
          backgroundColor: "#F7F8F9",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
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

  return (
    <SafeAreaView style={{ backgroundColor: "#F7F8F9", flex: 1 }}>
      <View style={styles.headerContainer}>
        <HamburgerButton userRole="eater" onMypage={() => {}} />
        <HeaderLogo />
      </View>

      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>햄찌네 피자</Text>
        <Text style={styles.storeAddress}>
          📍서울특별시 강남구 테헤란로 212
        </Text>
      </View>

      <TabSwitcher
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
      />

      <View style={{ flex: 1 }}>
        {activeTab === "menu" && <StoreMenuScreen storeId={storeId} />}
        {activeTab === "event" && <StoreEventScreen />}
        {activeTab === "review" && <StoreReviewScreen />}
      </View>

      {isEater && <BottomButton onPress={setBottomActiveScreen} />}
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
