// src/screens/Review/ReviewTabScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

import SearchBar from "../../components/SearchBar";
import GridComponent, { ReviewItem } from "../../components/GridComponent";
import CloseBtn from "../../../assets/closeBtn.svg";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import ResultModal from "../../components/ResultModal"; // ✅ Alert 대체

// 아이콘
import BookMark from "../../../assets/bookMark.svg";
import ColoredBookMark from "../../../assets/coloredBookMark.svg";
import GoToStore from "../../../assets/goToStore.svg";
import ColoredGoToStore from "../../../assets/coloredGoToStore.svg";

// Auth
import { useAuth } from "../../contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ReviewTabScreen"
>;

// 위치 정보 타입
interface LocationCoords {
  latitude: number;
  longitude: number;
}

// API 응답 타입
interface ApiFeedReviewItem {
  reviewId: number;
  storeName: string;
  description: string;
  menuNames: string[];
  imageUrl: string | null;
  shortsUrl: string | null;
  thumbnailUrl: string | null;
}

interface ApiFeedResponse {
  code: string;
  message: string;
  status: number;
  data: {
    reviews: ApiFeedReviewItem[];
    nearbyReviewsFound: boolean;
    hasNext: boolean;
  };
}

interface ApiDetailResponse {
  code: string;
  message: string;
  status: number;
  data: {
    reviewId: number;
    store: {
      storeId: number;
      storeName: string;
      address: string;
      latitude: number;
      longitude: number;
    };
    user: {
      userId: number;
      nickname: string;
    };
    description: string;
    menuNames: string[];
    imageUrl: string | null;
    shortsUrl: string | null;
    thumbnailUrl: string | null;
    scrapCount: number;
    isScrapped: boolean;
    createdAt: string;
  };
}

interface ScrapToggleResponse {
  code: string;
  message: string;
  status: number;
  data: { isScrapped: boolean; scrapCount: number };
  timestamp: string;
}

// ===== 확장 아이템 =====
interface ExtendedReviewItem extends ReviewItem {
  menuNames?: string[];
  store?: {
    storeId: number;
    storeName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  user?: { userId: number; nickname: string };
  scrapCount?: number;
  isScrapped?: boolean;
  createdAt?: string;
}

// 기본 위치 (신논현역) - GPS 실패 시 fallback용
const DEFAULT_COORDS = {
  latitude: 37.5044,
  longitude: 127.0244,
};

// API
const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

// ✅ 비디오 썸네일이 없을 때 Grid가 비디오 URL을 Image에 물지 않도록 하는 1x1 placeholder
const PLACEHOLDER_THUMB =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    return token;
  } catch (error) {
    console.error("AsyncStorage 토큰 조회 실패:", error);
    return null;
  }
};

// 위치 가져오기 (모든 Alert → ResultModal로 대체)
const getCurrentLocation = async (
  notify: (
    type: "success" | "failure",
    msg: string,
    title?: string,
    onClose?: () => void
  ) => void
): Promise<LocationCoords> => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      notify(
        "failure",
        "위치 서비스를 활성화해주세요. 기본 위치(신논현역)를 사용합니다.",
        "위치 서비스 비활성화"
      );
      return DEFAULT_COORDS;
    }

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const { status: requestStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (requestStatus !== "granted") {
        notify(
          "failure",
          "리뷰를 보려면 위치 권한이 필요합니다. 기본 위치(신논현역)를 사용합니다.",
          "위치 권한 필요"
        );
        return DEFAULT_COORDS;
      }
      status = requestStatus;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 100,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("위치 가져오기 실패:", error);
    notify(
      "failure",
      "현재 위치를 확인할 수 없습니다. 기본 위치(신논현역)를 사용합니다.",
      "위치 확인 실패"
    );
    return DEFAULT_COORDS;
  }
};

// ===== API helpers =====
const fetchReviews = async (
  coords: LocationCoords,
  distance: number = 500,
  lastReviewId?: number
): Promise<ApiFeedResponse> => {
  const params = new URLSearchParams({
    latitude: coords.latitude.toString(),
    longitude: coords.longitude.toString(),
    distance: distance.toString(),
  });
  if (lastReviewId) params.append("lastReviewId", lastReviewId.toString());

  const token = await getAccessToken();
  if (!token) throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");

  const response = await fetch(
    `${API_BASE_URL}/api/reviews/feed?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401)
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};

const toggleReviewScrap = async (
  reviewId: number
): Promise<ScrapToggleResponse> => {
  const token = await getAccessToken();
  if (!token) throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");

  const response = await fetch(
    `${API_BASE_URL}/api/reviews/${reviewId}/scrap/toggle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401)
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    if (response.status === 404)
      throw new Error("해당 리뷰를 찾을 수 없습니다.");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};

const fetchReviewDetail = async (
  reviewId: number
): Promise<ApiDetailResponse> => {
  const token = await getAccessToken();
  if (!token) throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");

  const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401)
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};

// ===== 변환 유틸: 빈/잘못된 미디어 제거 & 안전 썸네일 보장 =====
const toReviewItemFromFeed = (
  api: ApiFeedReviewItem
): ExtendedReviewItem | null => {
  // 1) 이미지 우선
  if (api.imageUrl) {
    return {
      id: String(api.reviewId),
      title: api.storeName,
      description: api.description,
      type: "image",
      uri: api.imageUrl, // 상세/표시 모두 OK(이미지)
      thumbnail: api.imageUrl, // 그리드에서도 이미지 사용
      likes: 0,
      views: 0,
      menuNames: api.menuNames,
    };
  }
  // 2) 비디오: 재생 URL 필수
  if (api.shortsUrl) {
    return {
      id: String(api.reviewId),
      title: api.storeName,
      description: api.description,
      type: "video",
      uri: api.shortsUrl, // 상세에서 Video source로 사용
      thumbnail: api.thumbnailUrl || PLACEHOLDER_THUMB, // 그리드에서 Image에 안전하게 사용
      likes: 0,
      views: 0,
      menuNames: api.menuNames,
    };
  }
  // 3) 둘 다 없으면 제외
  return null;
};

const toReviewItemFromDetail = (
  d: ApiDetailResponse["data"]
): ExtendedReviewItem | null => {
  if (d.imageUrl) {
    return {
      id: String(d.reviewId),
      title: d.store.storeName,
      description: d.description,
      type: "image",
      uri: d.imageUrl,
      thumbnail: d.imageUrl,
      likes: 0,
      views: 0,
      menuNames: d.menuNames,
      store: d.store,
      user: d.user,
      scrapCount: d.scrapCount,
      isScrapped: d.isScrapped,
      createdAt: d.createdAt,
    };
  }
  if (d.shortsUrl) {
    return {
      id: String(d.reviewId),
      title: d.store.storeName,
      description: d.description,
      type: "video",
      uri: d.shortsUrl,
      thumbnail: d.thumbnailUrl || PLACEHOLDER_THUMB,
      likes: 0,
      views: 0,
      menuNames: d.menuNames,
      store: d.store,
      user: d.user,
      scrapCount: d.scrapCount,
      isScrapped: d.isScrapped,
      createdAt: d.createdAt,
    };
  }
  return null;
};

// ===== 컴포넌트 =====
export default function Reviews() {
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  // Auth
  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";
  const isEater = isLoggedIn && userRole === "EATER";

  // ResultModal 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalMessage, setModalMessage] = useState("");
  const [onModalClose, setOnModalClose] = useState<(() => void) | null>(null);

  const openModal = (
    type: "success" | "failure",
    message: string,
    title?: string,
    onClose?: () => void
  ) => {
    setModalType(type);
    setModalMessage(message);
    setModalTitle(title);
    setOnModalClose(() => (onClose ? onClose : null));
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    if (onModalClose) {
      const cb = onModalClose;
      setOnModalClose(null);
      cb();
    }
  };

  // 내부 핸들러
  const handleMypage = () => navigation.navigate("MypageScreen");

  // UI 상태
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ExtendedReviewItem | null>(
    null
  );

  // 위치 관련
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoords>(DEFAULT_COORDS);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // 데이터 상태
  const [reviewData, setReviewData] = useState<ExtendedReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [lastReviewId, setLastReviewId] = useState<number | undefined>();
  const [selectedDistance, setSelectedDistance] = useState(500);
  const [nearbyReviewsFound, setNearbyReviewsFound] = useState(true);

  // 상세보기 스크롤/비디오
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ExtendedReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});
  const loadedDetailIds = useRef<Set<string>>(new Set());

  // 초기 위치
  useEffect(() => {
    (async () => {
      const loc = await getCurrentLocation(openModal);
      setCurrentLocation(loc);
      setIsLocationLoading(false);
    })();
  }, []);

  // 위치/거리 변경 시 피드 로드
  useEffect(() => {
    if (!isLocationLoading && currentLocation) {
      loadInitialReviews(currentLocation);
    }
  }, [isLocationLoading, currentLocation, selectedDistance]);

  // 비디오 재생 제어
  useEffect(() => {
    Object.keys(vdoRefs.current).forEach((key) => {
      const idx = parseInt(key, 10);
      const video = vdoRefs.current[idx];
      if (!video) return;
      if (idx === currentIndex) video.playAsync();
      else video.pauseAsync();
    });
  }, [currentIndex]);

  const loadInitialReviews = async (coords?: LocationCoords) => {
    const locationToUse = coords || currentLocation;
    setIsLoading(true);
    try {
      const data = await fetchReviews(locationToUse, selectedDistance);

      const converted = data.data.reviews
        .map(toReviewItemFromFeed)
        .filter((it): it is ExtendedReviewItem => it !== null);

      setReviewData(converted);
      setHasNextPage(data.data.hasNext);
      setNearbyReviewsFound(data.data.nearbyReviewsFound);
      setLastReviewId(
        data.data.reviews.length > 0
          ? data.data.reviews[data.data.reviews.length - 1].reviewId
          : undefined
      );

      if (!data.data.nearbyReviewsFound) {
        openModal(
          "failure",
          `반경 ${selectedDistance}m 내에 리뷰가 없어 전체 리뷰를 보여드립니다.`,
          "알림"
        );
      }

      setSelectedItem(null);
      setCurrentIndex(0);
      loadedDetailIds.current.clear();
    } catch (error: any) {
      console.error("리뷰 로드 실패:", error);
      if (error.message?.includes("인증이 만료")) {
        openModal("failure", error.message, "인증 오류", () =>
          navigation.navigate("Login")
        );
      } else {
        openModal("failure", "리뷰를 불러오는데 실패했습니다.", "오류");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasNextPage || isLoadingMore || !lastReviewId) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchReviews(
        currentLocation,
        selectedDistance,
        lastReviewId
      );
      const converted = data.data.reviews
        .map(toReviewItemFromFeed)
        .filter((it): it is ExtendedReviewItem => it !== null);

      setReviewData((prev) => [...prev, ...converted]);
      setHasNextPage(data.data.hasNext);
      setLastReviewId(
        data.data.reviews.length > 0
          ? data.data.reviews[data.data.reviews.length - 1].reviewId
          : lastReviewId
      );
    } catch (error: any) {
      console.error("추가 리뷰 로드 실패:", error);
      if (error.message?.includes("인증이 만료")) {
        openModal("failure", error.message, "인증 오류", () =>
          navigation.navigate("Login")
        );
      } else {
        openModal("failure", "추가 리뷰를 불러오는데 실패했습니다.", "오류");
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadReviewDetail = async (reviewId: string) => {
    if (loadedDetailIds.current.has(reviewId)) return;
    setIsLoadingDetail(true);
    try {
      const res = await fetchReviewDetail(parseInt(reviewId, 10));
      const detailed = toReviewItemFromDetail(res.data);
      if (!detailed) {
        // 상세에서도 미디어가 없으면 건너뜀
        loadedDetailIds.current.add(reviewId);
        return;
      }

      // 목록 업데이트
      setReviewData((prev) =>
        prev.map((it) => (it.id === reviewId ? { ...it, ...detailed } : it))
      );
      // 선택 아이템이면 동기화
      setSelectedItem((prev) =>
        prev && prev.id === reviewId ? { ...prev, ...detailed } : prev
      );
      loadedDetailIds.current.add(reviewId);
    } catch (error: any) {
      console.error("리뷰 상세 로드 실패:", error);
      if (error.message?.includes("인증이 만료")) {
        openModal("failure", error.message, "인증 오류", () =>
          navigation.navigate("Login")
        );
      } else {
        openModal(
          "failure",
          "리뷰 상세 정보를 불러오는데 실패했습니다.",
          "오류"
        );
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDistanceChange = (distance: number) => {
    setSelectedDistance(distance);
    setLastReviewId(undefined);
    setReviewData([]);
  };

  // 스크롤 페이징 + 상세 보장
  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const page = Math.round(offsetY / screenHeight);

      flatListRef.current?.scrollToOffset({
        offset: page * screenHeight,
        animated: false,
      });
      setCurrentIndex(page);

      const item = reviewData[page];
      if (item) {
        setSelectedItem(item);
        if (!loadedDetailIds.current.has(item.id)) {
          loadReviewDetail(item.id);
        }
      }
    },
    [screenHeight, reviewData]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
    }
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleOpenDetail = async (item: ExtendedReviewItem) => {
    setSelectedItem(item);
    const idx = reviewData.findIndex((i) => i.id === item.id);
    if (idx >= 0) setCurrentIndex(idx);

    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    await loadReviewDetail(item.id);
  };

  const handleBookmarkToggle = async (reviewIdStr: string) => {
    try {
      const reviewId = parseInt(reviewIdStr, 10);
      const res = await toggleReviewScrap(reviewId);

      setReviewData((prev) =>
        prev.map((it) =>
          it.id === reviewIdStr
            ? {
                ...it,
                isScrapped: res.data.isScrapped,
                scrapCount: res.data.scrapCount,
              }
            : it
        )
      );
      setSelectedItem((prev) =>
        prev && prev.id === reviewIdStr
          ? {
              ...prev,
              isScrapped: res.data.isScrapped,
              scrapCount: res.data.scrapCount,
            }
          : prev
      );
    } catch (e: any) {
      if (e.message?.includes("인증이 만료")) {
        openModal("failure", e.message, "인증 오류", () =>
          navigation.navigate("Login")
        );
      } else {
        openModal("failure", "스크랩 처리에 실패했습니다.", "오류");
      }
    }
  };

  const handleGoToStore = async () => {
    let s = selectedItem?.store;

    if (!s && selectedItem?.id) {
      try {
        const detail = await fetchReviewDetail(parseInt(selectedItem.id, 10));
        const d = detail.data.store;
        s = {
          storeId: d.storeId,
          storeName: d.storeName,
          address: d.address,
          latitude: d.latitude,
          longitude: d.longitude,
        };
        const detailed = toReviewItemFromDetail(detail.data);
        if (detailed) {
          setSelectedItem(detailed);
          setReviewData((prev) =>
            prev.map((it) =>
              it.id === detailed.id ? { ...it, ...detailed } : it
            )
          );
        }
        loadedDetailIds.current.add(String(detail.data.reviewId));
      } catch (e) {
        openModal("failure", "가게 정보를 불러오지 못했습니다.", "오류");
        return;
      }
    }

    if (s?.storeId && s.storeId > 0) {
      navigation.navigate("StoreScreen", s);
    } else {
      openModal(
        "failure",
        "유효한 가게 ID가 없습니다. 잠시 후 다시 시도해주세요.",
        "알림"
      );
    }
  };

  // 위치 로딩 중
  if (isLocationLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>현재 위치를 확인하는 중...</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>리뷰를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (showTypeDropdown || showDistanceDropdown) {
          setShowTypeDropdown(false);
          setShowDistanceDropdown(false);
        }
        Keyboard.dismiss();
      }}
      disabled={!(showTypeDropdown || showDistanceDropdown)}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => {
              if (showTypeDropdown || showDistanceDropdown) {
                setShowTypeDropdown(false);
                setShowDistanceDropdown(false);
              }
            }}
          >
            <HamburgerButton
              userRole={isMaker ? "maker" : "eater"}
              onMypage={() => navigation.navigate("MypageScreen")}
            />
          </TouchableOpacity>
          <HeaderLogo />
        </View>

        {/* 서치바 */}
        <SearchBar
          showTypeDropdown={showTypeDropdown}
          setShowTypeDropdown={setShowTypeDropdown}
          showDistanceDropdown={showDistanceDropdown}
          setShowDistanceDropdown={setShowDistanceDropdown}
          onDistanceChange={handleDistanceChange}
          selectedDistance={selectedDistance}
        />

        {/* 피드 상태 표시 */}
        {!nearbyReviewsFound && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>
              반경 {selectedDistance}m 내 리뷰가 없어 전체 리뷰를 표시합니다
            </Text>
          </View>
        )}

        {/* 상세보기 모드 */}
        {selectedItem ? (
          <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
            <FlatList
              key="detail"
              ref={flatListRef}
              data={reviewData}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const marked = item.isScrapped === true;
                return (
                  <View style={{ height: screenHeight }}>
                    {item.type === "image" ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <Video
                        ref={(ref: Video | null) => {
                          vdoRefs.current[index] = ref;
                        }}
                        source={{ uri: item.uri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={index === currentIndex}
                        isLooping
                        isMuted
                      />
                    )}

                    {/* 닫기 버튼 */}
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setSelectedItem(null)}
                    >
                      <CloseBtn />
                    </TouchableOpacity>

                    {/* 텍스트 오버레이 */}
                    <View
                      style={[styles.textOverlay, { bottom: height * 0.25 }]}
                    >
                      <Text style={styles.titleText}>#{item.title}</Text>
                      <Text style={styles.descText}>{item.description}</Text>
                      {item.menuNames?.length ? (
                        <Text style={styles.menuText}>
                          메뉴: {item.menuNames.join(", ")}
                        </Text>
                      ) : null}
                      {item.user ? (
                        <Text style={styles.userText}>
                          by {item.user.nickname}
                        </Text>
                      ) : null}
                      {typeof item.scrapCount === "number" ? (
                        <Text style={styles.scrapText}>
                          스크랩 {item.scrapCount}회
                        </Text>
                      ) : null}
                    </View>

                    {/* 로딩 오버레이 (상세 처음 읽는 중일 때) */}
                    {isLoadingDetail && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingOverlayText}>
                          상세 정보 로딩 중...
                        </Text>
                      </View>
                    )}

                    {/* 우측 버튼들 */}
                    <View style={styles.goToStoreAndBookMarkContainer}>
                      <TouchableOpacity onPress={handleGoToStore}>
                        <GoToStore />
                      </TouchableOpacity>
                      {isEater && (
                        <TouchableOpacity
                          onPress={() => handleBookmarkToggle(item.id)}
                          disabled={isLoadingDetail}
                        >
                          {marked ? (
                            <ColoredBookMark style={styles.bookMark} />
                          ) : (
                            <BookMark style={styles.bookMark} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={screenHeight}
              snapToAlignment="start"
              initialScrollIndex={Math.max(
                0,
                reviewData.findIndex((i) => i.id === selectedItem.id)
              )}
              getItemLayout={(data, index) => ({
                length: screenHeight,
                offset: screenHeight * index,
                index,
              })}
              onMomentumScrollEnd={handleMomentumEnd}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewConfig}
              windowSize={2}
              initialNumToRender={1}
              maxToRenderPerBatch={1}
              removeClippedSubviews
            />
          </Animated.View>
        ) : (
          // 그리드 보기
          <FlatList
            key="grid"
            data={reviewData}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            renderItem={({ item, index }) => (
              <GridComponent
                item={item}
                size={containerWidth / 3}
                index={index}
                totalLength={reviewData.length}
                onPress={() => handleOpenDetail(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            removeClippedSubviews
            onEndReached={loadMoreReviews}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#0066cc" />
                  <Text style={styles.loadingText}>
                    더 많은 리뷰를 불러오는 중...
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* 리뷰가 없는 경우 */}
        {reviewData.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>표시할 리뷰가 없습니다.</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => loadInitialReviews()}
            >
              <Text style={styles.refreshButtonText}>새로고침</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ ResultModal 공통 출력 */}
        <ResultModal
          visible={modalVisible}
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          onClose={closeModal}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { justifyContent: "center", alignItems: "center" },
  headerContainer: { flexDirection: "row", paddingTop: 40 },
  closeBtn: { position: "absolute", top: 0, right: 0, padding: 15, zIndex: 5 },
  textOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 12,
    marginRight: 100,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  descText: { color: "#fff", fontSize: 13, marginBottom: 4 },
  menuText: {
    color: "#fff",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 2,
  },
  userText: { color: "#fff", fontSize: 11, opacity: 0.8, marginBottom: 2 },
  scrapText: { color: "#fff", fontSize: 11, opacity: 0.8 },
  goToStoreAndBookMarkContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 200,
    right: 10,
  },
  bookMark: { width: 10, height: 10 },
  statusBanner: {
    backgroundColor: "#fff3cd",
    padding: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusText: { color: "#856404", fontSize: 12, textAlign: "center" },
  footerLoader: { padding: 20, alignItems: "center" },
  loadingText: { marginTop: 8, color: "#666", fontSize: 14 },
  emptyContainer: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emptyText: { fontSize: 16, color: "#666", marginBottom: 16 },
  refreshButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingOverlayText: { color: "#fff", marginTop: 8, fontSize: 14 },
});
