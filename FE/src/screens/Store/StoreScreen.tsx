import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import TabSwitcher from "../../components/TabSwitcher";
import BottomButton from "../../components/BottomButton";
import ResultModal from "../../components/ResultModal";

import StoreMenuScreen from "./StoreMenuScreen";
import StoreEventScreen from "./StoreEventScreen";
import StoreReviewScreen from "./StoreReviewScreen";
import { useAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

import PosterPreviewModal from "../../components/PosterPreviewModal";
import { getAdoptedMenuPostersByStore } from "./Menu/services/api";

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

type AdoptedPoster = {
  menuPosterId: number;
  imageUrl: string;
};

export default function StoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StoreRouteProp>();
  const storeId = route?.params?.storeId;

  const { isLoggedIn, userRole } = useAuth();
  const isEater = isLoggedIn && userRole === "EATER";
  const canDeleteEvents = isLoggedIn && userRole === "MAKER";

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bottomActiveScreen, setBottomActiveScreen] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("menu");

  // 가게 정보
  const [storeInfo, setStoreInfo] = useState<{
    name: string;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // 채택된 메뉴포스터(썸네일 바)
  const [adoptedPosters, setAdoptedPosters] = useState<AdoptedPoster[]>([]);
  const [postersLoading, setPostersLoading] = useState(false); // (유지)
  const [postersError, setPostersError] = useState<string | null>(null); // (유지)

  // 미리보기 모달
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const [posterInitialIndex, setPosterInitialIndex] = useState(0);

  // ResultModal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  const onModalCloseRef = useRef<(() => void) | null>(null);

  const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

  const openModal = (
    type: "success" | "failure",
    message: string,
    title?: string,
    onClose?: () => void
  ) => {
    setModalType(type);
    setModalMessage(message);
    setModalTitle(title ?? (type === "success" ? "알림" : "오류"));
    onModalCloseRef.current = onClose ?? null;
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    const cb = onModalCloseRef.current;
    onModalCloseRef.current = null;
    cb?.();
  };

  // 가게 정보 조회
  const fetchStoreInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        openModal("failure", "로그인이 필요합니다.", "인증 오류", () =>
          navigation.navigate("Login")
        );
        setLoading(false);
        return;
      }

      setAccessToken(token);

      const params = new URLSearchParams({ storeId: storeId.toString() });
      const apiUrl = `${API_BASE_URL}/api/stores?${params.toString()}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem("accessToken");
          openModal("failure", "다시 로그인해주세요.", "인증 만료", () =>
            navigation.navigate("Login")
          );
          return;
        }
        if (response.status === 404) {
          openModal("failure", "가게 정보를 찾을 수 없습니다.", "오류");
          return;
        }
        if (response.status === 500) {
          openModal("failure", "잠시 후 다시 시도해주세요.", "서버 오류");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StoreInfoResponse = JSON.parse(responseText);
      if (data.status === 200) {
        setStoreInfo({
          name: data.data.name || "가게 이름",
          address: data.data.address || "주소 정보 없음",
        });
      } else {
        openModal(
          "failure",
          data.message || "가게 정보를 불러오는데 실패했습니다.",
          "오류"
        );
      }
    } catch (error: any) {
      console.error("가게 정보 조회 실패:", error);
      openModal("failure", `네트워크 오류: ${error.message}`, "오류");
    } finally {
      setLoading(false);
    }
  };

  // 채택된 메뉴포스터 조회
  const fetchAdopted = async () => {
    if (!storeId) return;
    try {
      setPostersLoading(true);
      setPostersError(null);

      const list = await getAdoptedMenuPostersByStore(storeId);

      const seen = new Set<number>();
      const unique = list.filter((p) => {
        const id = Number(p.menuPosterId);
        if (!Number.isFinite(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      setAdoptedPosters(unique.slice(0, 5));
    } catch (e: any) {
      console.warn("[StoreScreen] adopted fetch error:", e?.message || e);
      setAdoptedPosters([]);
      setPostersError(e?.message || "채택된 메뉴판을 불러오지 못했습니다.");
      // 필요 시 모달로도 보여줄 수 있음(지금은 조용히 실패)
    } finally {
      setPostersLoading(false);
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

  const handleBottomButtonPress = (screen: string) => {
    setBottomActiveScreen(screen);
  };

  const handleMypage = () => {
    console.log("마이페이지로 이동");
  };

  // mount & storeId 변경 시
  useEffect(() => {
    if (!storeId || storeId <= 0) {
      console.warn("[StoreScreen] invalid storeId:", storeId);
      setLoading(false);
      return;
    }
    fetchStoreInfo();
  }, [storeId]);

  // 채택된 포스터는 페이지 들어올 때 한 번 로드 (EATER일 때만)
  useEffect(() => {
    if (isEater && storeId) fetchAdopted();
  }, [isEater, storeId]);

  // 하단 버튼 네비게이션
  useEffect(() => {
    if (!bottomActiveScreen) return;

    switch (bottomActiveScreen) {
      case "review":
        navigation.navigate("ReviewWriteScreen", {
          storeId,
          storeName: storeInfo?.name || "가게 이름",
          address: storeInfo?.address || "주소 정보 없음",
        });
        break;
      case "map":
        navigation.navigate("MapScreen", {});
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
    setBottomActiveScreen(null);
  }, [bottomActiveScreen, storeId, storeInfo, navigation]);

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
            onMypage={() => {}}
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

  const openPosterModalAt = (idx: number) => {
    setPosterInitialIndex(idx);
    setPosterModalVisible(true);
  };

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
        {activeTab === "event" && (
          <StoreEventScreen storeId={storeId} canDelete={canDeleteEvents} />
        )}
        {activeTab === "review" && accessToken && (
          <StoreReviewScreen storeId={storeId} />
        )}
      </View>

      {/* === 채택된 메뉴포스터 썸네일 바 (EATER 전용) === */}
      {isEater && activeTab === "menu" && adoptedPosters.length > 0 && (
        <View style={styles.posterBar}>
          <Text style={styles.posterBarTitle}>사장님이 채택한 메뉴판</Text>
          <FlatList
            data={adoptedPosters}
            keyExtractor={(p, i) => `${p.menuPosterId}-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.posterThumbWrap}
                activeOpacity={0.85}
                onPress={() => openPosterModalAt(index)}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.posterThumb}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isEater && activeTab==="menu" && <BottomButton onPress={handleBottomButtonPress} />}

      {/* 포스터 미리보기 모달 */}
      <PosterPreviewModal
        visible={posterModalVisible}
        onClose={() => setPosterModalVisible(false)}
        posters={adoptedPosters.map((p, i) => ({
          id: String(p.menuPosterId ?? i),
          uri: p.imageUrl,
        }))}
        initialIndex={posterInitialIndex}
        title="메뉴판 미리보기"
      />

      {/* 공통 ResultModal */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleModalClose}
      />
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

  // === 썸네일 바 ===
  posterBar: {
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderTopColor: "#e5e7eb",
  },
  posterBarTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 12,
    marginBottom: 6,
  },
  posterThumbWrap: {
    marginRight: 15,
  },
  posterThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
});
