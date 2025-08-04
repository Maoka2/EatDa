import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  Dimensions,
  Animated,
  FlatList,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, textStyles, SPACING, RADIUS } from "../../constants/theme";
import MypageGridComponent, { ReviewItem } from "../../components/MypageGridComponent";
import ProfileSection from "../../components/ProfileSection";
import TabNavigation from "../../components/TabNavigation";
import { reviewData } from "../../data/reviewData";
import CloseBtn from "../../../assets/closeBtn.svg";

interface EaterMypageProps {
  userRole: "eater";
  onLogout: () => void;
}

type TabKey = "myReviews" | "scrappedReviews" | "myMenuBoard";

export default function EaterMypage({ userRole, onLogout }: EaterMypageProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;
  const [activeTab, setActiveTab] = useState<TabKey>("myReviews");

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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIdx = viewableItems[0].index;
      setCurrentIndex(newIdx);
    }
  }).current;

  const viewConfig = useRef({
    viewAreaCoveragePercentThreshold: 80,
  }).current;

  // 데이터 
  const myReviewsData = reviewData.slice(0, 6);
  const scrappedReviewsData = reviewData.slice(6, 10); 

  // 그리드 사이즈 계산 - 넓힘
  const gridSize = (width - SPACING.md * 2 - 16) / 2; // 2열 그리드, 간격 8px씩 총 16px 고려

  return (
    <View style={styles.container}>

      {/* 상세보기 모드 */}
      {selectedItem ? (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <FlatList
            key="detail"
            ref={flatListRef}
            data={myReviewsData}
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
                    setSelectedItem(null);
                  }}
                >
                  <CloseBtn></CloseBtn>
                </TouchableOpacity>

                {/* 하단 텍스트 리뷰 오버레이 */}
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
            initialScrollIndex={myReviewsData.findIndex(
              (i) => i.id === selectedItem.id
            )}
            getItemLayout={(data, index) => ({
              length: screenHeight,
              offset: screenHeight * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfig}
            windowSize={2}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            removeClippedSubviews
          />
        </Animated.View>
      ) : (
        // 일반 모드
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 프로필 섹션 */}
          <ProfileSection userType="eater" userName="Eater" />

        {/* 탭 메뉴 */}
        <TabNavigation
          userType="eater"
          activeTab={activeTab}
          onTabPress={(tabKey) => setActiveTab(tabKey as TabKey)}
        />

          {/* 탭 콘텐츠 */}
          <View style={styles.tabContent}>
            {activeTab === "myReviews" && (
              myReviewsData.length > 0 ? (
                <View style={styles.gridContainer}>
                  {myReviewsData.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={myReviewsData.length}
                      onPress={() => {
                        handleOpenDetail(item);
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <Text style={styles.emptyText}>내가 작성한 리뷰가 없습니다</Text>
                </View>
              )
            )}

            {/* 스크랩한 리뷰 */}
            {activeTab === "scrappedReviews" && (
              scrappedReviewsData.length > 0 ? (
                <View style={styles.gridContainer}>
                  {scrappedReviewsData.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={scrappedReviewsData.length}
                      onPress={() => {
                        handleOpenDetail(item);
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <Text style={styles.emptyText}>스크랩한 리뷰가 없습니다</Text>
                </View>
              )
            )}

            {activeTab === "myMenuBoard" && (
              <View style={styles.emptyContent}>
                <Text style={styles.emptyText}>만든 메뉴판이 없습니다</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  tabContent: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textColors.secondary,
  },
  closeBtn: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  textOverlay: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  titleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  descText: {
    color: "#fff",
    fontSize: 14,
    marginTop: SPACING.xs,
  },
});
