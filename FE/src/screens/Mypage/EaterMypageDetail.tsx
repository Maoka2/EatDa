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
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import MypageGridComponent, { ReviewItem } from "../../components/MypageGridComponent";
import TabNavigation from "../../components/TabNavigation";
import { reviewData } from "../../data/reviewData";
import CloseBtn from "../../../assets/closeBtn.svg";


// 빈 상태 아이콘 import
const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

interface EaterMypageProps {
  userRole: "eater";
  onLogout: () => void;
  initialTab?: TabKey; // 초기 탭 설정
  onBack?: () => void; // 뒤로가기 핸들러
  setHeaderVisible?: (visible: boolean) => void;
}

type TabKey = "myReviews" | "scrappedReviews" | "myMenuBoard";

// 빈 상태 컴포넌트
const EmptyState = ({ message, icon }: { message: string; icon?: any }) => (
  <View style={styles.emptyContent}>
    {icon && <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function EaterMypage({ userRole, onLogout, initialTab = "myReviews", onBack, setHeaderVisible }: EaterMypageProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

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
      setHeaderVisible?.(false); // 헤더 숨기기
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
                    setHeaderVisible?.(true); // 헤더 다시 보이기
                  }}
                >
                  <CloseBtn />
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
            initialScrollIndex={Math.max(0, myReviewsData.findIndex(
              (i) => i.id === selectedItem.id
            ))}
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
                <EmptyState 
                  message="내가 남긴 리뷰가 없습니다" 
                  icon={EmptyIcon}
                />
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
                <EmptyState 
                  message="스크랩한 리뷰가 없습니다" 
                  icon={EmptyIcon}
                />
              )
            )}

            {activeTab === "myMenuBoard" && (
              <EmptyState 
                message="내가 만든 메뉴판이 없습니다" 
                icon={EmptyIcon}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    width: '20%',  // 부모 기준 비율
    aspectRatio: 1, // 정사각형
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textColors.secondary,
    textAlign: "center",
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
