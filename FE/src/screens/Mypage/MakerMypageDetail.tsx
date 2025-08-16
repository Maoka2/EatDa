// src/screens/Mypage/MakerMypageDetail.tsx
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
  ViewToken,
  ImageStyle,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, SPACING } from "../../constants/theme";
import MypageGridComponent, {
  ReviewItem,
} from "../../components/MypageGridComponent";
import TabNavigation from "../../components/TabNavigation";
import CloseBtn from "../../../assets/closeBtn.svg";

import { getMyEvents } from "../EventMaking/services/api";
import { getReceivedReviews } from "./services/api";
// 받은 메뉴판 목록 & 매핑은 그대로 사용
import {
  getReceivedMenuPosters,
  mapReceivedPostersToGridItems,
} from "./services/api";

// 채택 API (Store > Menu 서비스에 있음)
import { adoptMenuPosters } from "../Store/Menu/services/api";

// 빈 상태 아이콘
const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

// FlatList 가시영역 설정(훅 아님 — 순서 안전)
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 80 as const };

type TabKey = "storeReviews" | "storeEvents" | "receivedMenuBoard";

interface MakerMypageProps {
  userRole: "maker";
  onLogout: () => void;
  initialTab?: TabKey;
  onBack?: () => void;
  setHeaderVisible?: (visible: boolean) => void;
  /** 채택 API에 필수 — 사장님 가게의 storeId */
  storeId?: number;
}

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
  storeId,
}: MakerMypageProps) {
  // ---- 모든 훅은 최상단 고정 (순서 변동 금지) ----
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // 내 가게에 적힌 리뷰
  const [reviewsData, setReviewsData] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // 내 가게 이벤트
  const [eventsData, setEventsData] = useState<ReviewItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // 받은 메뉴판
  const [receivedPosters, setReceivedPosters] = useState<ReviewItem[]>([]);
  const [loadingReceivedPosters, setLoadingReceivedPosters] = useState(false);
  const [receivedPostersError, setReceivedPostersError] = useState<
    string | null
  >(null);

  // 상세보기 상태
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [detailList, setDetailList] = useState<ReviewItem[]>([]);
  const [detailSource, setDetailSource] = useState<TabKey | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});
  const scaleAnimRef = useRef(new Animated.Value(1));
  const scaleAnim = scaleAnimRef.current;

  // 채택 진행 상태
  const [adopting, setAdopting] = useState(false);

  // 현재 인덱스에 맞춰 비디오 재생/일시정지
  useEffect(() => {
    Object.keys(vdoRefs.current).forEach((key) => {
      const idx = parseInt(key, 10);
      const video = vdoRefs.current[idx];
      if (!video) return;
      if (idx === currentIndex) video.playAsync();
      else video.pauseAsync();
    });
  }, [currentIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index as number);
      }
    },
    []
  );

  // ---- 데이터 로딩 훅들 ----
  // 내 가게 리뷰
  useEffect(() => {
    if (activeTab !== "storeReviews") return;

    setLoadingReviews(true);
    setReviewsError(null);

    getReceivedReviews({ size: 30 })
      .then((res) => {
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

  // 내 가게 이벤트
  useEffect(() => {
    if (activeTab !== "storeEvents") return;

    setLoadingEvents(true);
    setEventsError(null);

    getMyEvents()
      .then((res) => {
        const mapped: ReviewItem[] = (Array.isArray(res) ? res : [])
          .map((e: any) => {
            const id = e?.eventId ?? e?.id ?? Math.random();
            const uri = e?.postUrl ?? e?.mediaUrl ?? e?.imageUrl ?? "";
            if (!uri) return null;

            const type: "image" | "video" =
              e?.mediaType === "video" ? "video" : "image";
            const title = e?.title ?? "이벤트";
            const descParts: string[] = [];
            if (e?.storeName) descParts.push(e.storeName);
            if (e?.startAt && e?.endAt)
              descParts.push(`${e.startAt} ~ ${e.endAt}`);
            const description = e?.description ?? descParts.join(" · ");

            return {
              id: String(id),
              type,
              uri,
              title,
              description,
            } as ReviewItem;
          })
          .filter((x: ReviewItem | null): x is ReviewItem => !!x);

        setEventsData(mapped);
      })
      .catch((err) => {
        console.error("이벤트 불러오기 실패", err);
        setEventsError(err?.message ?? "이벤트 불러오기에 실패했습니다");
      })
      .finally(() => setLoadingEvents(false));
  }, [activeTab]);

  // 받은 메뉴판
  useEffect(() => {
    if (activeTab !== "receivedMenuBoard") return;

    setLoadingReceivedPosters(true);
    setReceivedPostersError(null);

    (async () => {
      try {
        const posters = await getReceivedMenuPosters();
        const mapped = mapReceivedPostersToGridItems(
          posters,
          "받은 메뉴판"
        ) as ReviewItem[];
        setReceivedPosters(mapped);
      } catch (err: any) {
        console.error("[RCV-POSTERS][UI] fetch:error", err);
        setReceivedPostersError(
          err?.message ?? "받은 메뉴판을 불러오지 못했습니다"
        );
      } finally {
        setLoadingReceivedPosters(false);
      }
    })();
  }, [activeTab]);

  // 상세 열기
  const handleOpenDetail = (item: ReviewItem, source: TabKey) => {
    const list =
      source === "storeEvents"
        ? eventsData
        : source === "receivedMenuBoard"
        ? receivedPosters
        : reviewsData;

    setDetailList(list);
    setSelectedItem(item);
    setDetailSource(source);
    setHeaderVisible?.(false);

    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // 받은 메뉴판 상세에서 "채택하기"
  const handleAdoptCurrent = useCallback(() => {
    if (detailSource !== "receivedMenuBoard" || !selectedItem) return;

    const idNum = Number.parseInt(selectedItem.id, 10);
    if (!Number.isFinite(idNum)) {
      Alert.alert("오류", "잘못된 메뉴판 ID입니다.");
      return;
    }
    if (!storeId || !Number.isFinite(storeId)) {
      Alert.alert("오류", "가게 식별자(storeId)가 없어 채택할 수 없습니다.");
      return;
    }

    Alert.alert(
      "이 메뉴판을 채택할까요?",
      "선택하면 가게 페이지의 채택된 메뉴판이 교체될 수 있어요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "채택",
          style: "default",
          onPress: async () => {
            try {
              setAdopting(true);
              await adoptMenuPosters({ storeId, menuPosterIds: [idNum] });
              Alert.alert("완료", "메뉴판을 채택했습니다.");
            } catch (e: any) {
              Alert.alert("오류", e?.message ?? "채택에 실패했습니다.");
            } finally {
              setAdopting(false);
            }
          },
        },
      ]
    );
  }, [detailSource, selectedItem, storeId]);

  const gridSize = (width - SPACING.md * 2 - 16) / 2;

  // ---- 렌더 ----
  return (
    <View style={styles.container}>
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
                    style={styles.imageFill}
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

                {/* 받은 메뉴판 상세에서는 텍스트 오버레이 숨김 (기존) */}
                {detailSource !== "receivedMenuBoard" && (
                  <View style={[styles.textOverlay, { bottom: height * 0.1 }]}>
                    <Text style={styles.titleText}>#{item.title}</Text>
                    {!!item.description && (
                      <Text style={styles.descText}>{item.description}</Text>
                    )}
                  </View>
                )}

                {/* 받은 메뉴판일 때만 채택 버튼 노출 */}
                {detailSource === "receivedMenuBoard" && (
                  <View style={[styles.adoptBar, { bottom: 24 }]}>
                    <TouchableOpacity
                      style={[styles.adoptBtn, adopting && { opacity: 0.7 }]}
                      activeOpacity={0.85}
                      onPress={handleAdoptCurrent}
                      disabled={adopting}
                    >
                      {adopting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.adoptBtnText}>
                          이 메뉴판 채택하기
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
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
            viewabilityConfig={VIEWABILITY_CONFIG}
            windowSize={2}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            removeClippedSubviews
          />
        </Animated.View>
      ) : (
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
            {activeTab === "receivedMenuBoard" &&
              (loadingReceivedPosters ? (
                <EmptyState
                  message="받은 메뉴판 불러오는 중..."
                  icon={EmptyIcon}
                />
              ) : receivedPostersError ? (
                <EmptyState message={receivedPostersError} icon={EmptyIcon} />
              ) : receivedPosters.length > 0 ? (
                <View style={styles.gridContainer}>
                  {receivedPosters.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={receivedPosters.length}
                      onPress={() =>
                        handleOpenDetail(item, "receivedMenuBoard")
                      }
                    />
                  ))}
                </View>
              ) : (
                <EmptyState message="받은 메뉴판이 없습니다" icon={EmptyIcon} />
              ))}
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
    color: COLORS.textColors?.secondary ?? "#666",
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
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  } as ImageStyle,

  // 채택 바/버튼
  adoptBar: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  adoptBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fc6fae",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  adoptBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
