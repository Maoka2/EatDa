import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactElement,
} from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import SearchBar from "../../components/SearchBar";
import GridComponent, { ReviewItem } from "../../components/GridComponent";
import Sidebar from "../../components/Sidebar";
import MypageScreen from "../Mypage/MypageScreen";
import CloseBtn from "../../../assets/closeBtn.svg";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import StoreScreen from "../Store/StoreScreen";

// 북마크, 가게 가는 아이콘 import
import BookMark from "../../../assets/bookMark.svg";
import ColoredBookMark from "../../../assets/coloredBookMark.svg";
import GoToStore from "../../../assets/goToStore.svg";
import ColoredGoToStore from "../../../assets/coloredGoToStore.svg";

// 분기처리용 import
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

// 스크랩 토글 API 응답 타입
interface ScrapToggleResponse {
  code: string;
  message: string;
  status: number;
  data: {
    isScrapped: boolean;
    scrapCount: number;
  };
  timestamp: string;
}

// 확장된 ReviewItem 타입 (상세 정보 포함)
interface ExtendedReviewItem extends ReviewItem {
  menuNames?: string[];
  store?: {
    storeId: number;
    storeName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  user?: {
    userId: number;
    nickname: string;
  };
  scrapCount?: number;
  isScrapped?: boolean;
  createdAt?: string;
}

// 신논현역 좌표
const SHINNONHYEON_COORDS = {
  latitude: 37.5044,
  longitude: 127.0244,
};

// API 설정
const API_BASE_URL = 'https://i13a609.p.ssafy.io/test';

// 토큰 가져오는 함수
const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    console.log('AsyncStorage에서 가져온 토큰:', token ? '토큰 존재' : '토큰 없음');
    return token;
  } catch (error) {
    console.error('AsyncStorage에서 토큰 가져오기 실패:', error);
    return null;
  }
};

// API 함수들
const fetchReviews = async (
  distance: number = 500,
  lastReviewId?: number
): Promise<ApiFeedResponse> => {
  try {
    const params = new URLSearchParams({
      latitude: SHINNONHYEON_COORDS.latitude.toString(),
      longitude: SHINNONHYEON_COORDS.longitude.toString(),
      distance: distance.toString(),
    });

    if (lastReviewId) {
      params.append('lastReviewId', lastReviewId.toString());
    }

    console.log('API 호출 URL:', `${API_BASE_URL}/api/reviews/feed?${params.toString()}`);

    const token = await getAccessToken();
    
    if (!token) {
      console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      throw new Error('로그인이 필요합니다. 토큰을 확인해주세요.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    console.log('요청 헤더:', headers);

    const response = await fetch(`${API_BASE_URL}/api/reviews/feed?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    console.log('응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 에러 응답:', errorText);
      
      if (response.status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('API 응답 데이터:', data);
    return data;
  } catch (error) {
    console.error('API 호출 실패:', error);
    
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('네트워크 연결 실패. 서버 상태를 확인해주세요.');
    }
    
    throw error;
  }
};

// 스크랩 토글 API 함수
const toggleReviewScrap = async (reviewId: number): Promise<ScrapToggleResponse> => {
  try {
    console.log('스크랩 토글 API 호출:', `${API_BASE_URL}/api/reviews/${reviewId}/scrap/toggle`);

    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('로그인이 필요합니다. 토큰을 확인해주세요.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/scrap/toggle`, {
      method: 'POST',
      headers,
    });

    console.log('스크랩 토글 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('스크랩 토글 API 에러:', errorText);
      
      if (response.status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      if (response.status === 404) {
        throw new Error('해당 리뷰를 찾을 수 없습니다.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('스크랩 토글 응답 데이터:', data);
    return data;
  } catch (error) {
    console.error('스크랩 토글 실패:', error);
    
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('네트워크 연결 실패. 서버 상태를 확인해주세요.');
    }
    
    throw error;
  }
};

const fetchReviewDetail = async (reviewId: number): Promise<ApiDetailResponse> => {
  try {
    console.log('상세 조회 API 호출:', `${API_BASE_URL}/api/reviews/${reviewId}`);

    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('로그인이 필요합니다. 토큰을 확인해주세요.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
      method: 'GET',
      headers,
    });

    console.log('상세 조회 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('상세 조회 API 에러:', errorText);
      
      if (response.status === 401) {
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('상세 조회 응답 데이터:', data);
    return data;
  } catch (error) {
    console.error('리뷰 상세 조회 실패:', error);
    
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('네트워크 연결 실패. 서버 상태를 확인해주세요.');
    }
    
    throw error;
  }
};

// API 데이터를 ReviewItem으로 변환
const convertFeedItemToReviewItem = (apiItem: ApiFeedReviewItem): ExtendedReviewItem => {
  const isImage = apiItem.imageUrl !== null;
  
  return {
    id: apiItem.reviewId.toString(),
    title: apiItem.storeName,
    description: apiItem.description,
    type: isImage ? 'image' : 'video',
    uri: isImage ? apiItem.imageUrl! : apiItem.shortsUrl!, // 상세뷰용: 이미지면 imageUrl, 비디오면 shortsUrl
    thumbnail: isImage ? apiItem.imageUrl! : apiItem.thumbnailUrl!, // 그리드뷰용: 이미지면 imageUrl, 비디오면 thumbnailUrl
    likes: 0, // 피드에서는 제공되지 않음
    views: 0, // 피드에서는 제공되지 않음
    menuNames: apiItem.menuNames,
  };
};

const convertDetailToReviewItem = (apiDetail: ApiDetailResponse['data']): ExtendedReviewItem => {
  const isImage = apiDetail.imageUrl !== null;
  
  return {
    id: apiDetail.reviewId.toString(),
    title: apiDetail.store.storeName,
    description: apiDetail.description,
    type: isImage ? 'image' : 'video',
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

export default function Reviews(props?: ReviewProps) {
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  // 분기처리용
  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";
  const isEater = isLoggedIn && userRole === "EATER";

  // 내장 네비게이션 함수들
  const handleLogout = () => {
    navigation.navigate("Login");
  };

  const handleMypage = () => {
    setCurrentPage("mypage");
    setIsSidebarOpen(false);
  };

  // props가 있으면 props 함수 사용, 없으면 내장 함수 사용
  const onLogout = props?.onLogout || handleLogout;
  const onMypage = props?.onMypage || handleMypage;

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedReviewItem | null>(null);

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

  //상세보기 스크롤 및 비디오 관리
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ExtendedReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});
  const [showStoreScreen, setShowStoreScreen] = useState(false);

  // 북마크 누르기용 (API 상세에서 가져온 값 사용)
  const [isBookMarked, setIsBookMarked] = useState(false);

  // 북마크 토글 함수
  const handleBookmarkToggle = async () => {
    if (!selectedItem) return;

    try {
      const response = await toggleReviewScrap(parseInt(selectedItem.id));
      
      // UI 즉시 업데이트
      setIsBookMarked(response.data.isScrapped);
      
      // 선택된 아이템의 스크랩 정보 업데이트
      const updatedItem = {
        ...selectedItem,
        isScrapped: response.data.isScrapped,
        scrapCount: response.data.scrapCount,
      };
      setSelectedItem(updatedItem);
      
      // 리뷰 데이터 배열에서도 업데이트
      setReviewData(prev => 
        prev.map(item => 
          item.id === selectedItem.id 
            ? { ...item, isScrapped: response.data.isScrapped, scrapCount: response.data.scrapCount }
            : item
        )
      );

      // 사용자에게 피드백 제공 (선택사항 - 너무 많은 알림이 싫다면 제거)
      // Alert.alert(
      //   "알림",
      //   response.data.isScrapped 
      //     ? "리뷰를 스크랩했습니다!" 
      //     : "스크랩을 해제했습니다."
      // );
      
    } catch (error: any) {
      if (error.message.includes('로그인이 필요') || error.message.includes('인증이 만료')) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" }
        ]);
      } else {
        Alert.alert("오류", "스크랩 처리에 실패했습니다.");
      }
      console.error('북마크 토글 실패:', error);
    }
  };

  // 가게 가기 버튼
  const [isGoToStoreClicked, setIsGoToStoreClicked] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialReviews();
  }, [selectedDistance]);

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

  const loadInitialReviews = async () => {
    setIsLoading(true);
    try {
      // 먼저 토큰이 있는지 확인
      const token = await getAccessToken();
      if (!token) {
        Alert.alert("인증 오류", "로그인이 필요합니다.", [
          { text: "확인", onPress: () => navigation.navigate("Login") }
        ]);
        return;
      }

      const response = await fetchReviews(selectedDistance);
      const convertedReviews = response.data.reviews.map(convertFeedItemToReviewItem);
      
      setReviewData(convertedReviews);
      setHasNextPage(response.data.hasNext);
      setNearbyReviewsFound(response.data.nearbyReviewsFound);
      
      // 마지막 리뷰 ID 설정
      if (convertedReviews.length > 0) {
        setLastReviewId(response.data.reviews[response.data.reviews.length - 1].reviewId);
      }

      // 주변 리뷰가 없어서 전체 피드를 제공하는 경우 알림
      if (!response.data.nearbyReviewsFound) {
        Alert.alert(
          "알림",
          `반경 ${selectedDistance}m 내에 리뷰가 없어 전체 리뷰를 보여드립니다.`
        );
      }
    } catch (error: any) {
      if (error.message.includes('로그인이 필요') || error.message.includes('인증이 만료')) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" }
        ]);
      } else {
        Alert.alert("오류", "리뷰를 불러오는데 실패했습니다.");
      }
      console.error('리뷰 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasNextPage || isLoadingMore || !lastReviewId) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchReviews(selectedDistance, lastReviewId);
      const convertedReviews = response.data.reviews.map(convertFeedItemToReviewItem);
      
      setReviewData(prev => [...prev, ...convertedReviews]);
      setHasNextPage(response.data.hasNext);
      
      // 마지막 리뷰 ID 업데이트
      if (convertedReviews.length > 0) {
        setLastReviewId(response.data.reviews[response.data.reviews.length - 1].reviewId);
      }
    } catch (error: any) {
      if (error.message.includes('로그인이 필요') || error.message.includes('인증이 만료')) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" }
        ]);
      } else {
        Alert.alert("오류", "추가 리뷰를 불러오는데 실패했습니다.");
      }
      console.error('추가 리뷰 로드 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadReviewDetail = async (reviewId: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetchReviewDetail(parseInt(reviewId));
      const detailedItem = convertDetailToReviewItem(response.data);
      
      // 선택된 아이템을 상세 정보로 업데이트
      setSelectedItem(detailedItem);
      
      // 리뷰 데이터에서도 해당 아이템 업데이트
      setReviewData(prev => 
        prev.map(item => 
          item.id === reviewId ? { ...item, ...detailedItem } : item
        )
      );
    } catch (error: any) {
      if (error.message.includes('로그인이 필요') || error.message.includes('인증이 만료')) {
        Alert.alert("인증 오류", error.message, [
          { text: "로그인", onPress: () => navigation.navigate("Login") },
          { text: "취소" }
        ]);
      } else {
        Alert.alert("오류", "리뷰 상세 정보를 불러오는데 실패했습니다.");
      }
      console.error('리뷰 상세 로드 실패:', error);
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
      const newIdx = viewableItems[0].index;
      setCurrentIndex(newIdx);
    }
  }).current;

  const viewConfig = useRef({
    viewAreaCoveragePercentThreshold: 80,
  }).current;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleOpenDetail = async (item: ExtendedReviewItem) => {
    setSelectedItem(item);
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // 상세 정보를 가져와서 업데이트
    await loadReviewDetail(item.id);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0066cc" />
        <Text style={styles.loadingText}>더 많은 리뷰를 불러오는 중...</Text>
      </View>
    );
  };

  // 마이페이지 렌더링
  if (currentPage === "mypage") {
    navigation.navigate("MypageScreen");
    return null;
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
        {showStoreScreen ? (
          <StoreScreen
            onGoBack={() => {
              setShowStoreScreen(false);
              setIsGoToStoreClicked(false);
            }}
          />
        ) : (
          <>
            {/* 헤더 */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (showTypeDropdown || showDistanceDropdown) {
                    setShowTypeDropdown(false);
                    setShowDistanceDropdown(false);
                  }
                  setIsSidebarOpen(true);
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
              <Animated.View
                style={{ flex: 1, transform: [{ scale: scaleAnim }] }}
              >
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
                      <View
                        style={[styles.textOverlay, { bottom: height * 0.25 }]}
                      >
                        <Text style={styles.titleText}>#{item.title}</Text>
                        <Text style={styles.descText}>{item.description}</Text>
                        {item.menuNames && item.menuNames.length > 0 && (
                          <Text style={styles.menuText}>
                            메뉴: {item.menuNames.join(', ')}
                          </Text>
                        )}
                        {item.user && (
                          <Text style={styles.userText}>
                            by {item.user.nickname}
                          </Text>
                        )}
                        {item.scrapCount !== undefined && (
                          <Text style={styles.scrapText}>
                            스크랩 {item.scrapCount}회
                          </Text>
                        )}
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

                      <View style={styles.goToStoreAndBookMarkContainer}>
                        {/* 가게페이지로 이동 */}
                        <TouchableOpacity
                          onPress={() => {
                            setIsGoToStoreClicked(true);
                            setShowStoreScreen(true);
                          }}
                        >
                          {isGoToStoreClicked ? (
                            <ColoredGoToStore />
                          ) : (
                            <GoToStore />
                          )}
                        </TouchableOpacity>

                        {/* 북마크 */}
                        {isEater && (
                          <TouchableOpacity
                            onPress={handleBookmarkToggle}
                          >
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
                ListFooterComponent={renderFooter}
              />
            )}

            {/* 리뷰가 없는 경우 */}
            {reviewData.length === 0 && !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  표시할 리뷰가 없습니다.
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={loadInitialReviews}
                >
                  <Text style={styles.refreshButtonText}>새로고침</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  descText: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 4,
  },
  menuText: {
    color: "#fff",
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  userText: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 2,
  },
  scrapText: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.8,
  },
  goToStoreAndBookMarkContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 200,
    right: 10,
  },
  bookMark: {
    width: 10,
    height: 10,
  },
  statusBanner: {
    backgroundColor: '#fff3cd',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
});