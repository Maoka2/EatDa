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
  Alert,
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

interface ReviewProps {
  userRole?: "eater" | "maker";
  onLogout?: () => void;
  onMypage?: () => void;
}

// 위치 정보 타입
interface LocationCoords {
  latitude: number;
  longitude: number;
}

// API 응답 타입 정의
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

// API 설정
const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    console.log(
      "AsyncStorage에서 가져온 토큰:",
      token ? "토큰 존재" : "토큰 없음"
    );
    return token;
  } catch (error) {
    console.error("AsyncStorage에서 토큰 가져오기 실패:", error);
    return null;
  }
};

// 위치 권한 요청 및 현재 위치 가져오기
const getCurrentLocation = async (): Promise<LocationCoords> => {
  try {
    // 위치 서비스 활성화 확인
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert(
        "위치 서비스 비활성화",
        "위치 서비스를 활성화해주세요. 기본 위치(신논현역)를 사용합니다.",
        [{ text: "확인" }]
      );
      return DEFAULT_COORDS;
    }

    // 위치 권한 확인
    let { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      // 권한 요청
      const { status: requestStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (requestStatus !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "리뷰를 보려면 위치 권한이 필요합니다. 기본 위치(신논현역)를 사용합니다.",
          [{ text: "확인" }]
        );
        return DEFAULT_COORDS;
      }
      status = requestStatus;
    }

    // 현재 위치 가져오기
    console.log("현재 위치 가져오는 중...");
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 100,
    });

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    console.log("현재 위치:", coords);
    return coords;
  } catch (error) {
    console.error("위치 가져오기 실패:", error);
    Alert.alert(
      "위치 확인 실패",
      "현재 위치를 확인할 수 없습니다. 기본 위치(신논현역)를 사용합니다.",
      [{ text: "확인" }]
    );
    return DEFAULT_COORDS;
  }
};

// API 함수들
const fetchReviews = async (
  coords: LocationCoords,
  distance: number = 500,
  lastReviewId?: number
): Promise<ApiFeedResponse> => {
  try {
    const params = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      distance: distance.toString(),
    });

    if (lastReviewId) {
      params.append("lastReviewId", lastReviewId.toString());
    }

    console.log(
      "API 호출 URL:",
      `${API_BASE_URL}/api/reviews/feed?${params.toString()}`
    );
    console.log("사용된 위치:", coords);

    const token = await getAccessToken();

    if (!token) {
      console.error("인증 토큰이 없습니다. 로그인이 필요합니다.");
      throw new Error("로그인이 필요합니다. 토큰을 확인해주세요.");
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    console.log("요청 헤더:", headers);

    const response = await fetch(
      `${API_BASE_URL}/api/reviews/feed?${params.toString()}`,
      {
        method: "GET",
        headers,
      }
    );

    console.log("응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API 에러 응답:", errorText);

      if (response.status === 401) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }

      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("API 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("API 호출 실패:", error);

    if (
      error instanceof TypeError &&
      error.message === "Network request failed"
    ) {
      throw new Error("네트워크 연결 실패. 서버 상태를 확인해주세요.");
    }

    throw error;
  }
};

// 스크랩 토글 API 함수
const toggleReviewScrap = async (
  reviewId: number
): Promise<ScrapToggleResponse> => {
  try {
    console.log(
      "스크랩 토글 API 호출:",
      `${API_BASE_URL}/api/reviews/${reviewId}/scrap/toggle`
    );

    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인이 필요합니다. 토큰을 확인해주세요.");
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(
      `${API_BASE_URL}/api/reviews/${reviewId}/scrap/toggle`,
      {
        method: "POST",
        headers,
      }
    );

    console.log("스크랩 토글 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("스크랩 토글 API 에러:", errorText);

      if (response.status === 401) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }

      if (response.status === 404) {
        throw new Error("해당 리뷰를 찾을 수 없습니다.");
      }

      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("스크랩 토글 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("스크랩 토글 실패:", error);

    if (
      error instanceof TypeError &&
      error.message === "Network request failed"
    ) {
      throw new Error("네트워크 연결 실패. 서버 상태를 확인해주세요.");
    }

    throw error;
  }
};

const fetchReviewDetail = async (
  reviewId: number
): Promise<ApiDetailResponse> => {
  try {
    console.log(
      "상세 조회 API 호출:",
      `${API_BASE_URL}/api/reviews/${reviewId}`
    );

    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인이 필요합니다. 토큰을 확인해주세요.");
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
      method: "GET",
      headers,
    });

    console.log("상세 조회 응답 상태:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("상세 조회 API 에러:", errorText);

      if (response.status === 401) {
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }

      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("상세 조회 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("리뷰 상세 조회 실패:", error);

    if (
      error instanceof TypeError &&
      error.message === "Network request failed"
    ) {
      throw new Error("네트워크 연결 실패. 서버 상태를 확인해주세요.");
    }

    throw error;
  }
};

// API 데이터를 ReviewItem으로 변환
const convertFeedItemToReviewItem = (
  apiItem: ApiFeedReviewItem
): ExtendedReviewItem => {
  const isImage = apiItem.imageUrl !== null;

  return {
    id: String(apiItem.reviewId),
    title: apiItem.storeName,
    description: apiItem.description,
    type: isImage ? "image" : "video",
    uri: isImage ? apiItem.imageUrl! : apiItem.shortsUrl!, // 상세뷰용: 이미지면 imageUrl, 비디오면 shortsUrl
    thumbnail: isImage ? apiItem.imageUrl! : apiItem.thumbnailUrl!, // 그리드뷰용: 이미지면 imageUrl, 비디오면 thumbnailUrl
    likes: 0, // 피드에서는 제공되지 않음
    views: 0, // 피드에서는 제공되지 않음
    menuNames: apiItem.menuNames,
  };
};

const convertDetailToReviewItem = (
  apiDetail: ApiDetailResponse["data"]
): ExtendedReviewItem => {
  const isImage = apiDetail.imageUrl !== null;

  return {
    id: apiDetail.reviewId.toString(),
    title: apiDetail.store.storeName,
    description: apiDetail.description,
    type: isImage ? "image" : "video",
    uri: isImage ? apiDetail.imageUrl! : apiDetail.shortsUrl!, // 상세뷰용: 이미지면 imageUrl, 비디오면 shortsUrl
    thumbnail: isImage ? apiDetail.imageUrl! : apiDetail.thumbnailUrl!, // 그리드뷰용: 이미지면 imageUrl, 비디오면 thumbnailUrl
    likes: 0, // API에서 제공되지 않음
    views: 0, // API에서 제공되지 않음
    menuNames: apiDetail.menuNames,
    store: apiDetail.store,
    user: apiDetail.user,
    scrapCount: apiDetail.scrapCount,
    isScrapped: apiDetail.isScrapped,
    createdAt: apiDetail.createdAt,
  };
};

// ===== 컴포넌트 =====
export default function Reviews(props?: ReviewProps) {
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  // Auth
  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";
  const isEater = isLoggedIn && userRole === "EATER";

  // 내부 핸들러 (필요 시 props 덮어쓰기)
  const handleLogout = () => navigation.navigate("Login");
  const handleMypage = () => {
    setCurrentPage("mypage");
  };
  const onLogout = props?.onLogout || handleLogout;
  const onMypage = props?.onMypage || handleMypage;

  // UI 상태
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedReviewItem | null>(
    null
  );

  // 위치 관련 상태
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoords>(DEFAULT_COORDS);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // API 관련 상태
  const [reviewData, setReviewData] = useState<ExtendedReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [lastReviewId, setLastReviewId] = useState<number | undefined>();
  const [selectedDistance, setSelectedDistance] = useState(500);
  const [nearbyReviewsFound, setNearbyReviewsFound] = useState(true);

  // 페이지 네비게이션 관리
  const [currentPage, setCurrentPage] = useState<"reviewPage" | "mypage">(
    "reviewPage"
  );

  // 상세보기 스크롤/비디오
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ExtendedReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

  // 북마크
  const [isBookMarked, setIsBookMarked] = useState(false);

  // 위치 권한 재요청 함수
  const requestLocationAgain = async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // 위치가 변경되면 데이터 다시 로드
      loadInitialReviews(location);
    } catch (error) {
      console.error("위치 재요청 실패:", error);
      setLocationError("위치 정보를 가져올 수 없습니다.");
    } finally {
      setIsLocationLoading(false);
    }
  };



  // 가게 가기 버튼
  const [isGoToStoreClicked, setIsGoToStoreClicked] = useState(false);

  // 컴포넌트 마운트 시 위치 정보 가져오기
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        setLocationError(null);
      } catch (error) {
        console.error("위치 초기화 실패:", error);
        setLocationError("위치 정보를 가져올 수 없습니다.");
        // 기본 위치로 설정 (이미 DEFAULT_COORDS로 초기화됨)
      } finally {
        setIsLocationLoading(false);
      }
    };

    initializeLocation();
  }, []);

  // 위치 정보가 준비되면 리뷰 로드
  useEffect(() => {
    if (!isLocationLoading && currentLocation) {
      loadInitialReviews(currentLocation);
    }
  }, [isLocationLoading, currentLocation, selectedDistance]);

  // 비디오 재생 관리
  useEffect(() => {
    Object.keys(vdoRefs.current).forEach((key) => {
      const idx = parseInt(key, 10);
      const video = vdoRefs.current[idx];
      if (!video) return;
      if (idx === currentIndex) {
        video.playAsync();
      } else {
        video.pauseAsync();
      }
    });
  }, [currentIndex]);

  // 선택된 아이템의 북마크 상태 동기화
  useEffect(() => {
    if (selectedItem && selectedItem.isScrapped !== undefined) {
      setIsBookMarked(selectedItem.isScrapped);
    }
  }, [selectedItem]);

  const loadInitialReviews = async (coords?: LocationCoords) => {
    const locationToUse = coords || currentLocation;
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert("인증 오류", "로그인이 필요합니다.", [
          { text: "확인", onPress: () => navigation.navigate("Login") },
        ]);
        return;
      }

      const response = await fetchReviews(locationToUse, selectedDistance);
      const convertedReviews = response.data.reviews.map(
        convertFeedItemToReviewItem
      );

      setReviewData(convertedReviews);
      setHasNextPage(response.data.hasNext);
      setNearbyReviewsFound(response.data.nearbyReviewsFound);

      // 마지막 리뷰 ID 설정
      if (convertedReviews.length > 0) {
        setLastReviewId(
          response.data.reviews[response.data.reviews.length - 1].reviewId
        );
      }

      if (!response.data.nearbyReviewsFound) {
        Alert.alert(
          "알림",
          `반경 ${selectedDistance}m 내에 리뷰가 없어 전체 리뷰를 보여드립니다.`
        );
      }
    } catch (error: any) {
      if (
        error.message.includes("로그인이 필요") ||
        error.message.includes("인증이 만료")
      ) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" },
        ]);
      } else {
        Alert.alert("오류", "리뷰를 불러오는데 실패했습니다.");
      }
      console.error("리뷰 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasNextPage || isLoadingMore || !lastReviewId) return;
    setIsLoadingMore(true);
    try {
      const response = await fetchReviews(
        currentLocation,
        selectedDistance,
        lastReviewId
      );
      const convertedReviews = response.data.reviews.map(
        convertFeedItemToReviewItem
      );

      setReviewData((prev) => [...prev, ...convertedReviews]);
      setHasNextPage(response.data.hasNext);

      // 마지막 리뷰 ID 업데이트
      if (convertedReviews.length > 0) {
        setLastReviewId(
          response.data.reviews[response.data.reviews.length - 1].reviewId
        );
      }
    } catch (error: any) {
      if (
        error.message.includes("로그인이 필요") ||
        error.message.includes("인증이 만료")
      ) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" },
        ]);
      } else {
        Alert.alert("오류", "추가 리뷰를 불러오는데 실패했습니다.");
      }
      console.error("추가 리뷰 로드 실패:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadReviewDetail = async (reviewId: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchReviewDetail(parseInt(reviewId, 10));
      const detailedItem = convertDetailToReviewItem(response.data);

      // 선택된 아이템을 상세 정보로 업데이트
      setSelectedItem(detailedItem);

      // 리뷰 데이터에서도 해당 아이템 업데이트
      setReviewData((prev) =>
        prev.map((item) =>
          item.id === reviewId ? { ...item, ...detailedItem } : item
        )
      );
    } catch (error: any) {
      if (
        error.message.includes("로그인이 필요") ||
        error.message.includes("인증이 만료")
      ) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" },
        ]);
      } else {
        Alert.alert("오류", "리뷰 상세 정보를 불러오는데 실패했습니다.");
      }
      console.error("리뷰 상세 로드 실패:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDistanceChange = (distance: number) => {
    setSelectedDistance(distance);
    setLastReviewId(undefined);
    setReviewData([]);
  };

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const page = Math.round(offsetY / screenHeight);
      flatListRef.current?.scrollToOffset({
        offset: page * screenHeight,
        animated: false,
      });
      setCurrentIndex(page);
    },
    [screenHeight]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleOpenDetail = async (item: ExtendedReviewItem) => {
    setSelectedItem(item);
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    await loadReviewDetail(item.id);
  };

  // 북마크 상태 동기화
  useEffect(() => {
    if (selectedItem?.isScrapped !== undefined) {
      setIsBookMarked(selectedItem.isScrapped);
    }
  }, [selectedItem]);

  const handleBookmarkToggle = async () => {
    if (!selectedItem) return;
    try {
      const res = await toggleReviewScrap(parseInt(selectedItem.id, 10));
      setIsBookMarked(res.data.isScrapped);
      const updated = {
        ...selectedItem,
        isScrapped: res.data.isScrapped,
        scrapCount: res.data.scrapCount,
      };
      setSelectedItem(updated);
      setReviewData((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id
            ? {
                ...it,
                isScrapped: res.data.isScrapped,
                scrapCount: res.data.scrapCount,
              }
            : it
        )
      );
    } catch (e: any) {
      if (
        e.message?.includes("로그인이 필요") ||
        e.message?.includes("인증이 만료")
      ) {
        Alert.alert("인증 오류", e.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" },
        ]);
      } else {
        Alert.alert("오류", "스크랩 처리에 실패했습니다.");
      }
    }
  };

  // ✅ 가게로 이동 (네비게이션 파라미터 방식, 상세 미도착 대비 보강)
  const handleGoToStore = async () => {
    // 1) selectedItem에 store 정보가 있으면 그대로 사용
    let s = selectedItem?.store;

    // 2) 없으면 상세를 한번 더 조회해서 확보
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

        setSelectedItem(convertDetailToReviewItem(detail.data)); // 로컬 상태 동기화
      } catch (e) {
        Alert.alert("오류", "가게 정보를 불러오지 못했습니다.");
        return;
      }
    }

    // 3) 파라미터 검증 후 이동
    if (s?.storeId && s.storeId > 0) {
      const params = {
        storeId: s.storeId,
        storeName: s.storeName,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
      };
      console.log("[NAV] go StoreScreen with params:", params); // ✅ 디버그 로그
      navigation.navigate("StoreScreen", params);
    } else {
      Alert.alert(
        "알림",
        "유효한 가게 ID가 없습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  if (currentPage === "mypage") {
    navigation.navigate("MypageScreen");
    return null;
  }

  // 위치 로딩 중
  if (isLocationLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>현재 위치를 확인하는 중...</Text>
        {locationError && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestLocationAgain}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        )}
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
              // 사이드바 열림 로직이 있었다면 여기서 처리
            }}
          >
            <HamburgerButton
              userRole={isMaker ? "maker" : "eater"}
              onMypage={onMypage}
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
              renderItem={({ item, index }) => (
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
                    onPress={() => {
                      if (showTypeDropdown || showDistanceDropdown) {
                        setShowTypeDropdown(false);
                        setShowDistanceDropdown(false);
                      }
                      setSelectedItem(null);
                    }}
                  >
                    <CloseBtn />
                  </TouchableOpacity>

                  {/* 텍스트 오버레이 */}
                  <View style={[styles.textOverlay, { bottom: height * 0.25 }]}>
                    <Text style={styles.titleText}>#{item.title}</Text>
                    <Text style={styles.descText}>{item.description}</Text>
                    {item.menuNames && item.menuNames.length > 0 ? (
                      <Text style={styles.menuText}>
                        메뉴: {item.menuNames.join(", ")}
                      </Text>
                    ) : null}
                    {item.user ? (
                      <Text style={styles.userText}>
                        by {item.user.nickname}
                      </Text>
                    ) : null}
                    {item.scrapCount !== undefined ? (
                      <Text style={styles.scrapText}>
                        스크랩 {item.scrapCount}회
                      </Text>
                    ) : null}
                  </View>

                  {/* 로딩 오버레이 */}
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
                    {/* 가게페이지로 이동 */}
                    <TouchableOpacity onPress={handleGoToStore}>
                      {isGoToStoreClicked ? (
                        <ColoredGoToStore />
                      ) : (
                        <GoToStore />
                      )}
                    </TouchableOpacity>

                    {/* 북마크 */}
                    {isEater && (
                      <TouchableOpacity onPress={handleBookmarkToggle}>
                        {isBookMarked ? (
                          <ColoredBookMark style={styles.bookMark} />
                        ) : (
                          <BookMark style={styles.bookMark} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={screenHeight}
              snapToAlignment="start"
              initialScrollIndex={reviewData.findIndex(
                (i) => i.id === selectedItem.id
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
          // 전체 보기
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
                onPress={() => {
                  if (showTypeDropdown || showDistanceDropdown) {
                    setShowTypeDropdown(false);
                    setShowDistanceDropdown(false);
                  }
                  handleOpenDetail(item);
                }}
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
              onPress={loadInitialReviews}
            >
              <Text style={styles.refreshButtonText}>새로고침</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 15,
    zIndex: 5,
  },
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
  statusText: {
    color: "#856404",
    fontSize: 12,
    textAlign: "center",
  },
  footerLoader: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
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
  loadingOverlayText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  locationText: {
    fontSize: 12,
    color: "#6c757d",
    flex: 1,
  },
  locationRetryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  locationRetryText: {
    fontSize: 11,
    color: "#495057",
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
