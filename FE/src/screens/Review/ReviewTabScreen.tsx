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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Video, ResizeMode } from "expo-av";

import SearchBar from "../../components/SearchBar";
import GridComponent, { ReviewItem } from "../../components/GridComponent";
import Sidebar from "../../components/Sidebar";
import MypageScreen from "../Mypage/MypageScreen";
import { reviewData } from "../../data/reviewData";
import CloseBtn from "../../../assets/closeBtn.svg";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import StoreScreen from "../Store/StoreScreen"; // 가게 화면 import

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
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  // 페이지 네비게이션 관리
  const [currentPage, setCurrentPage] = useState<"reviewPage" | "mypage">(
    "reviewPage"
  );

  //상세보기 스크롤 및 비디오 관리
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});
  const [showStoreScreen, setShowStoreScreen] = useState(false); // StoreScreen 띄우기

  // 북마크 누르기용
  const [isBookMarked, setIsBookMarked] = useState(false);

  // 가게 가기 버튼
  const [isGoToStoreClicked, setIsGoToStoreClicked] = useState(false);

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
  const handleOpenDetail = (item: ReviewItem) => {
    setSelectedItem(item);
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // 마이페이지 렌더링
  if (currentPage === "mypage") {
    // MypageScreen으로 네비게이션 이동
    navigation.navigate("MypageScreen");
    return null; // 또는 로딩 컴포넌트
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
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
            />

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

                      {/* 텍스트 오버레이 (클릭 시 가게화면 띄움) */}
                      <View
                        style={[styles.textOverlay, { bottom: height * 0.25 }]}
                      >
                        <Text style={styles.titleText}>#{item.title}</Text>
                        <Text style={styles.descText}>{item.description}</Text>
                      </View>

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
                            onPress={() => setIsBookMarked((prev) => !prev)}
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
              />
            )}
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
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
});
