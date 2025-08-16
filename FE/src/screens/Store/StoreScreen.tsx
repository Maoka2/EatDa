// src/screens/Store/StoreScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "StoreScreen"
>;
type StoreRouteProp = RouteProp<AuthStackParamList, "StoreScreen">;

interface StoreInfoResponse {
  code: string;
  message: string;
  status: number;
  data: {
    name: string;
    address: string;
  };
  timestamp: string;
}

export default function StoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreRouteProp>();
  const storeId = route?.params?.storeId;

  const { isLoggedIn, userRole } = useAuth();
  const isEater = isLoggedIn && userRole === "EATER";

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bottomActiveScreen, setBottomActiveScreen] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("menu");

  // 가게 정보 상태
  const [storeInfo, setStoreInfo] = useState<{
    name: string;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

  // 가게 정보 조회 함수
  const fetchStoreInfo = async () => {
    try {
      console.log("=== 가게 정보 조회 시작 ===");
      console.log("가게 ID:", storeId);

      const token = await AsyncStorage.getItem("accessToken");
      console.log("토큰 확인:", token ? "있음" : "없음");

      if (!token) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      setAccessToken(token);

      const params = new URLSearchParams({
        storeId: storeId.toString(),
      });

      const apiUrl = `${API_BASE_URL}/api/stores?${params.toString()}`;
      console.log("요청 URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("응답 상태:", response.status);

      const responseText = await response.text();
      console.log("응답 본문:", responseText);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          await AsyncStorage.removeItem("accessToken");
          return;
        }

        if (response.status === 404) {
          Alert.alert("오류", "가게 정보를 찾을 수 없습니다.");
          return;
        }

        if (response.status === 500) {
          Alert.alert(
            "서버 오류",
            "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StoreInfoResponse = JSON.parse(responseText);
      console.log("성공 응답 데이터:", data);

      if (data.status === 200) {
        setStoreInfo({
          name: data.data.name || "가게 이름",
          address: data.data.address || "주소 정보 없음",
        });
        console.log("가게 정보 설정 완료:", data.data);
      } else {
        Alert.alert(
          "오류",
          data.message || "가게 정보를 불러오는데 실패했습니다."
        );
      }
    } catch (error: any) {
      console.error("가게 정보 조회 실패:", error);
      Alert.alert("오류", `네트워크 오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const convertUserRole = (
    role: string | null | undefined
  ): "eater" | "maker" => {
    if (role === "EATER") return "eater";
    if (role === "MAKER") return "maker";
    return "eater";
  };

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "event", label: "가게 이벤트" },
    { key: "review", label: "리뷰" },
  ];

  // 하단 버튼 핸들러
  const handleBottomButtonPress = (screen: string) => {
    setBottomActiveScreen(screen);
  };

  const handleMypage = () => {
    console.log("마이페이지로 이동");
    // navigation.navigate('MyPageScreen'); // 실제 마이페이지 화면으로 변경
  };

  const handleCloseBottomScreen = () => {
    setBottomActiveScreen(null);
  };

  // useEffect들을 항상 같은 순서로 호출되도록 배치
  useEffect(() => {
    if (!storeId || storeId <= 0) {
      console.warn("[StoreScreen] invalid storeId:", storeId);
      setLoading(false);
      return;
    }

    fetchStoreInfo();
  }, [storeId]);

  // useEffect로 네비게이션 처리 (렌더링 중이 아닌 사이드 이펙트로 처리)
  useEffect(() => {
    if (bottomActiveScreen) {
      switch (bottomActiveScreen) {
        case "review":
          navigation.navigate("ReviewWriteScreen", {
            storeId,
            storeName: storeInfo?.name || "가게 이름",
            address: storeInfo?.address || "주소 정보 없음",
          });
          break;
        case "map":
          navigation.navigate("MapScreen", {}); // 빈 객체 전달
          break;
        case "menu":
          navigation.navigate("MenuCustomScreen", {
            storeId,
            storeName: storeInfo?.name || "가게 이름",
            address: storeInfo?.address || "주소 정보 없음",
          });
          break;
        default:
          break;
      }
      // 상태 초기화
      setBottomActiveScreen(null);
    }
  }, [bottomActiveScreen, storeId, storeInfo]);

  // 조건부 렌더링을 return 직전에 처리
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <HamburgerButton
            userRole={convertUserRole(userRole)}
            onMypage={() => console.log("마이페이지로 이동")}
          />
          <HeaderLogo />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc6fae" />
          <Text style={styles.loadingText}>가게 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole={convertUserRole(userRole)}
          onMypage={handleMypage}
        />
        <HeaderLogo />
      </View>

      <View style={styles.storeInfoContainer}>
        <Text style={styles.storeName}>{storeInfo?.name || "가게 이름"}</Text>
        <Text style={styles.storeAddress}>
          📍 {storeInfo?.address || "주소 정보 없음"}
        </Text>
      </View>

      <TabSwitcher tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      <View style={{ flex: 1 }}>
        {activeTab === "menu" && accessToken && (
          <StoreMenuScreen storeId={storeId} accessToken={accessToken} />
        )}
        {activeTab === "event" && <StoreEventScreen />}
        {activeTab === "review" && <StoreReviewScreen storeId={storeId}/>}
      </View>

      {isEater && <BottomButton onPress={handleBottomButtonPress} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7F8F9",
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  storeInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 10,
    marginVertical: 10,
    shadowRadius: 3,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
