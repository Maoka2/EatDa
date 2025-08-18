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
import {
  getReceivedReviews,
  getReceivedMenuPosters,
  mapReceivedPostersToGridItems,
} from "./services/api";

import { adoptMenuPosters } from "../Store/Menu/services/api";
import ResultModal from "../../components/ResultModal";

const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 80 as const };

interface MakerMypageProps {
  userRole: "maker";
  onLogout: () => void;
  initialTab?: TabKey;
  onBack?: () => void;
  setHeaderVisible?: (visible: boolean) => void;
  storeId?: number; // 채택 시 필요
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

// ✅ 공통 ResultModal 상태
type ResultState = {
  visible: boolean;
  type: "success" | "failure";
  title?: string;
  message: string;
  onAfterClose?: () => void;
};

export default function MakerMypageDetail({
  userRole,
  onLogout,
  initialTab = "storeReviews",
  onBack,
  setHeaderVisible,
  storeId,
}: MakerMypageProps) {
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

  // 채택 진행 상태
  const [adopting, setAdopting] = useState(false);

  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});
  const scaleAnimRef = useRef(new Animated.Value(1));
  const scaleAnim = scaleAnimRef.current;

  // ✅ ResultModal 상태 & 헬퍼
  const [result, setResult] = useState<ResultState>({
    visible: false,
    type: "success",
    message: "",
  });
  const openResult = (next: Omit<ResultState, "visible">) =>
    setResult({ visible: true, ...next });
  const closeResult = () => {
    const after = result.onAfterClose;
    setResult({
      visible: false,
      type: "success",
      message: "",
      onAfterClose: undefined,
    });
    if (after) after();
  };

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
        const idx = viewableItems[0].index as number;
        setCurrentIndex(idx);
        if (detailSource === "receivedMenuBoard") {
          const cur = detailList[idx];
          if (cur) setSelectedItem(cur);
        }
      }
    },
    [detailList, detailSource]
  );

  // ---- 데이터 로딩 ----
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

    const idx = Math.max(
      0,
      list.findIndex((i) => i.id === item.id)
    );
    setDetailList(list);
    setSelectedItem(item);
    setDetailSource(source);
    setCurrentIndex(idx);
    setHeaderVisible?.(false);

    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  // ✅ 실제 채택 실행 (성공/실패는 ResultModal)
  const doAdopt = async (posterId: number) => {
    try {
      setAdopting(true);
      await adoptMenuPosters({
        storeId: Number(storeId),
        menuPosterIds: [posterId],
      });
      openResult({
        type: "success",
        title: "완료",
        message: "메뉴판을 채택했습니다.",
      });
    } catch (e: any) {
      openResult({
        type: "failure",
        title: "오류",
        message: e?.message || "채택에 실패했습니다.",
      });
    } finally {
      setAdopting(false);
    }
  };

  // ✅ 채택하기: Alert로 확인 받고, 실행 결과는 ResultModal
  const handleAdopt = () => {
    if (detailSource !== "receivedMenuBoard") return;

    const current = detailList[currentIndex] || selectedItem;
    if (!current) {
      openResult({
        type: "failure",
        title: "오류",
        message: "선택된 메뉴판 정보를 찾을 수 없습니다.",
      });
      return;
    }

    if (!storeId || !Number.isFinite(storeId)) {
      openResult({
        type: "failure",
        title: "오류",
        message: "가게 정보(storeId)를 불러오지 못했습니다.",
      });
      return;
    }

    const posterId = Number(current.id);
    if (!Number.isFinite(posterId)) {
      openResult({
        type: "failure",
        title: "오류",
        message: "유효하지 않은 메뉴판 ID 입니다.",
      });
      return;
    }

    Alert.alert(
      "채택하기",
      "이 메뉴판으로 교체 채택됩니다. 기존 채택 목록은 덮어씁니다.\n진행할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "채택",
          style: "destructive",
          onPress: () => doAdopt(posterId),
        },
      ]
    );
  };

  const gridSize = (width - SPACING.md * 2 - 16) / 2;

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

                {/* 받은 메뉴판 상세에서는 텍스트 오버레이 숨김 */}
                {detailSource !== "receivedMenuBoard" && (
                  <View style={[styles.textOverlay, { bottom: height * 0.1 }]}>
                    <Text style={styles.titleText}>#{item.title}</Text>
                    {!!item.description && (
                      <Text style={styles.descText}>{item.description}</Text>
                    )}
                  </View>
                )}

                {/* 받은 메뉴판 상세일 때만 채택 FAB */}
                {detailSource === "receivedMenuBoard" && (
                  <View style={styles.adoptFabWrapper}>
                    <TouchableOpacity
                      style={[styles.adoptFab, adopting && { opacity: 0.6 }]}
                      disabled={adopting}
                      onPress={handleAdopt}
                      activeOpacity={0.8}
                    >
                      {adopting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.adoptFabText}>채택하기</Text>
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
          <TabNavigation
            userType="maker"
            activeTab={activeTab}
            onTabPress={(tabKey) => setActiveTab(tabKey as TabKey)}
          />

          <View style={styles.tabContent}>
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

      {/* ✅ 결과 모달 (성공/실패 통합) */}
      <ResultModal
        visible={result.visible}
        type={result.type}
        title={result.title}
        message={result.message}
        onClose={closeResult}
      />
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

  adoptFabWrapper: {
    position: "absolute",
    right: 16,
    bottom: 32,
  },
  adoptFab: {
    backgroundColor: "#fec566",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  adoptFabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
