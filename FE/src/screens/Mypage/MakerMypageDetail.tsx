import React, { useState, useRef, useEffect } from "react";
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
  ViewToken,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, textStyles, SPACING, RADIUS } from "../../constants/theme";
import MypageGridComponent, {
  ReviewItem,
} from "../../components/MypageGridComponent";
import TabNavigation from "../../components/TabNavigation";
import { reviewData } from "../../data/reviewData";
import CloseBtn from "../../../assets/closeBtn.svg";
import { getMyEvents } from "../EventMaking/services/api";
import { getReceivedReviews } from "./services/api";

// 빈 상태 아이콘
const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

interface MakerMypageProps {
  userRole: "maker";
  onLogout: () => void;
  initialTab?: TabKey; // 초기 탭
  onBack?: () => void; // 뒤로가기 핸들러
  setHeaderVisible?: (visible: boolean) => void;
}

type TabKey = "storeReviews" | "storeEvents" | "receivedMenuBoard";

const EmptyState = ({ message, icon }: { message: string; icon?: any }) => (
  <View style={styles.emptyContent}>
    {icon && (
      <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />
    )}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function MakerMypageDetail({
  userRole,
  onLogout,
  initialTab = "storeReviews",
  onBack,
  setHeaderVisible,
}: MakerMypageProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // 내 가게에 적힌 리뷰 조회용
  const [reviewsData, setReviewsData] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // 내 가게 이벤트 용
  const [eventsData, setEventsData] = useState<ReviewItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // ===== 상세보기 상태 =====
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [detailList, setDetailList] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

  // 비디오 플레이/일시정지 컨트롤
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

  // 확대 애니메이션
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleOpenDetail = (item: ReviewItem, source: TabKey) => {
    // 상세보기 데이터 소스를 "현재 탭의 리스트"로 고정
    const list = source === "storeEvents" ? eventsData : reviewsData;
    setDetailList(list);
    setSelectedItem(item);
    setHeaderVisible?.(false);

    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index as number);
      }
    }
  ).current;

  const viewConfig = useRef({
    viewAreaCoveragePercentThreshold: 80,
  }).current;

  const storeEventsData = reviewData.slice(6, 12); // ← 더미 제거: 실제 API 사용

  // 내 가게 리뷰 조회 API 호출
  useEffect(() => {
    if (activeTab !== "storeReviews") return;

    setLoadingReviews(true);
    setReviewsError(null);

    getReceivedReviews({ size: 30 }) // 필요시 lastReviewId로 페이지네이션
      .then((res) => {
        // ReceivedReview -> ReviewItem 매핑
        const mapped: ReviewItem[] = (Array.isArray(res) ? res : [])
          .map((r, idx): ReviewItem | null => {
            const uri = r.shortsUrl || r.imageUrl || "";
            if (!uri) return null;

            return {
              id: `${uri}#${idx}`,
              type: r.shortsUrl ? "video" : "image",
              uri,
              title: "리뷰",
              description: r.description ?? "",
              // 너가 옵셔널로 바꿨다면 안 넣어도 됨. 기본값 쓰려면 아래 주석 해제
              // likes: 0,
              // views: 0,
            };
          })
          .filter(Boolean) as ReviewItem[];

        setReviewsData(mapped);
      })
      .catch((err) => {
        console.error("리뷰 불러오기 실패", err);
        setReviewsError(err?.message ?? "리뷰 불러오기에 실패했습니다");
      })
      .finally(() => setLoadingReviews(false));
  }, [activeTab]);

  // ===== 이벤트 API 호출 =====
  useEffect(() => {
    if (activeTab !== "storeEvents") return;

    setLoadingEvents(true);
    setEventsError(null);

    getMyEvents()
      .then((res) => {
        // 안전 매핑: 서버 응답의 가능한 키들을 가정
        // 예: { eventId, title, startAt, endAt, postUrl, storeName }
        const mapped: ReviewItem[] = (Array.isArray(res) ? res : [])
          .map((e: any) => {
            const id = e?.eventId ?? e?.id;
            const uri = e?.postUrl ?? e?.mediaUrl ?? e?.imageUrl ?? "";
            // 기본은 이미지로 처리. 서버가 타입 주면 맞춰서 변경.
            const type: "image" | "video" =
              e?.mediaType === "video" ? "video" : "image";
            const title = e?.title ?? "이벤트";
            const descParts: string[] = [];
            if (e?.storeName) descParts.push(e.storeName);
            if (e?.startAt && e?.endAt)
              descParts.push(`${e.startAt} ~ ${e.endAt}`);
            const description = e?.description ?? descParts.join(" · ");

            return {
              id: String(id ?? Math.random()),
              type,
              uri,
              title,
              description,
            };
          })
          .filter((x: ReviewItem) => !!x.uri);

        setEventsData(mapped);
      })
      .catch((err) => {
        console.error("이벤트 불러오기 실패", err);
        setEventsError(err?.message ?? "이벤트 불러오기에 실패했습니다");
      })
      .finally(() => setLoadingEvents(false));
  }, [activeTab]);

  // 그리드 셀 크기
  const gridSize = (width - SPACING.md * 2 - 16) / 2;

  // ===== 렌더 =====
  return (
    <View style={styles.container}>
      {/* 상세보기 모드 */}
      {selectedItem ? (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <FlatList
            key="detail"
            ref={flatListRef}
            data={detailList}
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

                {/* 닫기 */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    setSelectedItem(null);
                    setHeaderVisible?.(true);
                  }}
                >
                  <CloseBtn />
                </TouchableOpacity>

                {/* 하단 텍스트 오버레이 */}
                <View style={[styles.textOverlay, { bottom: height * 0.1 }]}>
                  <Text style={styles.titleText}>#{item.title}</Text>
                  {!!item.description && (
                    <Text style={styles.descText}>{item.description}</Text>
                  )}
                </View>
              </View>
            )}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={screenHeight}
            snapToAlignment="start"
            initialScrollIndex={Math.max(
              0,
              detailList.findIndex((i) => i.id === (selectedItem?.id ?? "")) ||
                0
            )}
            getItemLayout={(_, index) => ({
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
          {/* 탭 */}
          <TabNavigation
            userType="maker"
            activeTab={activeTab}
            onTabPress={(tabKey) => setActiveTab(tabKey as TabKey)}
          />

          {/* 탭 콘텐츠 */}
          <View style={styles.tabContent}>
            {/* 리뷰 탭 */}
            {activeTab === "storeReviews" &&
              (loadingReviews ? (
                <EmptyState message="리뷰 불러오는 중..." icon={EmptyIcon} />
              ) : reviewsError ? (
                <EmptyState message={reviewsError} icon={EmptyIcon} />
              ) : reviewsData.length > 0 ? (
                <View style={styles.gridContainer}>
                  {reviewsData.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={reviewsData.length}
                      onPress={() => handleOpenDetail(item, "storeReviews")}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState message="가게 리뷰가 없습니다" icon={EmptyIcon} />
              ))}

            {/* 이벤트 탭 */}
            {activeTab === "storeEvents" &&
              (loadingEvents ? (
                <EmptyState message="이벤트 불러오는 중..." icon={EmptyIcon} />
              ) : eventsError ? (
                <EmptyState message={eventsError} icon={EmptyIcon} />
              ) : eventsData.length > 0 ? (
                <View style={styles.gridContainer}>
                  {eventsData.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={eventsData.length}
                      onPress={() => handleOpenDetail(item, "storeEvents")}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState message="가게 이벤트가 없습니다" icon={EmptyIcon} />
              ))}

            {/* 받은 메뉴판 탭 */}
            {activeTab === "receivedMenuBoard" && (
              <EmptyState message="받은 메뉴판이 없습니다" icon={EmptyIcon} />
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
    paddingVertical: SPACING.xl * 4,
  },
  emptyIcon: {
    width: "20%",
    aspectRatio: 1,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textColors.secondary,
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 25,
    zIndex: 10,
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
    fontSize: 20,
    fontWeight: "bold",
  },
  descText: {
    color: "#fff",
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  dustbox: {
    position: "absolute",
    bottom: 300,
    right: 50,
    backgroundColor: "yellow",
    width: 100,
    height: 100,
  },
});
