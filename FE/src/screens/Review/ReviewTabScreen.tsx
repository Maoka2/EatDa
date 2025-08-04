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
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, textStyles } from "../../constants/theme";

import SearchBar from "../../components/SearchBar";
import GridComponent, { ReviewItem } from "../../components/GridComponent";
import Sidebar from "../../components/Sidebar";
import { reviewData } from "../../data/reviewData";
import CloseBtn from "../../../assets/closeBtn.svg";
// 햄버거 버튼 컴포넌트로 분리
import HamburgerButton from "../../components/Hamburger";

// 헤더로고 컴포넌트로 분리
import HeaderLogo from "../../components/HeaderLogo";

interface ReviewProps {
  userRole: "eater" | "maker";
  onLogout: () => void;
}

// 나중에 위로 땡겼을 때 새로고침이 필요한지?

export default function Reviews({ userRole, onLogout }: ReviewProps) {
  const { height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  // 서치바 및 드롭다운 관리
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);

  const [containerWidth, setContainerWidth] = useState(0);

  //사이드바 관리
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //상세보기 관리
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  //상세보기 스크롤 및 비디오 관리
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

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

  // 스크롤 시 1페이지씩만 이동
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

  // 확대 애니메이션 (전체 그리드 레이아웃 -> 단일 그리드)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleOpenDetail = (item: ReviewItem) => {
    setSelectedItem(item);
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    // 터치이벤트만 먹게끔 만듦
    <TouchableWithoutFeedback
      onPress={() => {
        if (showTypeDropdown || showDistanceDropdown) {
          setShowTypeDropdown(false);
          setShowDistanceDropdown(false);
        }
        Keyboard.dismiss();
      }}
      // 드롭다운박스 열려있을 떄만.
      disabled={!(showTypeDropdown || showDistanceDropdown)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* <StatusBar barStyle="dark-content" /> */}

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
            {/* 햄버거 아이콘 */}
            <HamburgerButton
              userRole="eater"
              onLogout={onLogout}
              activePage="review"
            ></HamburgerButton>
          </TouchableOpacity>
          {/* 로고 */}
          <HeaderLogo></HeaderLogo>
        </View>
        {/* 서치바 */}
        <SearchBar
          showTypeDropdown={showTypeDropdown}
          setShowTypeDropdown={setShowTypeDropdown}
          showDistanceDropdown={showDistanceDropdown}
          setShowDistanceDropdown={setShowDistanceDropdown}
        ></SearchBar>
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
                    <CloseBtn></CloseBtn>
                  </TouchableOpacity>

                  {/* 하단 텍스트 리뷰 오버레이 */}
                  {/* 누르면 해당 가게 페이지로 넘어가게끔 수정필요 */}
                  <View style={styles.textOverlay}>
                    <Text style={styles.titleText}>#{item.title}</Text>
                    <Text style={styles.descText}>{item.description}</Text>
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
        {/* 사이드바 */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userRole="eater"
          onLogout={onLogout}
          activePage="reviewPage"
          // onNavigate={}
        />
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
    // backgroundColor: "rgba(0,0,0,0.4)",
    padding: 15,
    zIndex: 5,
  },
  textOverlay: {
    position: "absolute",
    bottom: 200,
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
});
