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
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, SPACING } from "../../constants/theme";
import MypageGridComponent, {
  ReviewItem,
} from "../../components/MypageGridComponent";
import TabNavigation from "../../components/TabNavigation";
import CloseBtn from "../../../assets/closeBtn.svg";
import DustBox from "../../../assets/dustbox.svg";
import { getScrappedReviews } from "./services/api";
import {
  getMyReviews,
  mapMyReviewsToReviewItems,
  deleteMyReview,
} from "./services/api";

const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

interface EaterMypageProps {
  userRole: "eater";
  onLogout: () => void;
  initialTab?: TabKey;
  onBack?: () => void;
  setHeaderVisible?: (visible: boolean) => void;
}

type TabKey = "myReviews" | "scrappedReviews" | "myMenuBoard";

const EmptyState = ({ message, icon }: { message: string; icon?: any }) => (
  <View style={styles.emptyContent}>
    {icon && (
      <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />
    )}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function EaterMypage({
  userRole,
  onLogout,
  initialTab = "myReviews",
  onBack,
  setHeaderVisible,
}: EaterMypageProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [myReviews, setMyReviews] = useState<ReviewItem[]>([]);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);
  const [myReviewsError, setMyReviewsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "myReviews") return;

    setLoadingMyReviews(true);
    setMyReviewsError(null);
    console.log("[MYREVIEWS][UI] fetch:start", { pageSize: 30 }); // ★ 로그 추가

    getMyReviews({ pageSize: 30 })
      .then((list) => {
        console.log("[MYREVIEWS][UI] fetch:success raw =", list); // ★ 로그 추가
        if (!Array.isArray(list)) {
          setMyReviews([]);
          return;
        }
        const mapped = mapMyReviewsToReviewItems(list) as ReviewItem[];
        setMyReviews(mapped);
      })
      .catch((err) => {
        console.error("[MYREVIEWS][UI] fetch:error", err); // ★ 로그 추가
        setMyReviewsError(err?.message ?? "내 리뷰를 불러오지 못했습니다");
      })
      .finally(() => {
        setLoadingMyReviews(false);
        console.log("[MYREVIEWS][UI] fetch:finally"); // ★ 로그 추가
      });
  }, [activeTab]);

  // 스크랩한 리뷰 관련
  const [scraps, setScraps] = useState<ReviewItem[]>([]);
  const [loadingScraps, setLoadingScraps] = useState(false);
  const [scrapsError, setScrapsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "scrappedReviews") return;
    setLoadingScraps(true);
    setScrapsError(null);
    getScrappedReviews({ size: 30 })
      .then((list) => {
        if (!Array.isArray(list)) {
          setScraps([]);
          return;
        }
        const mapped: ReviewItem[] = list
          .map((r, idx): ReviewItem | null => {
            const uri = r.shortsUrl || r.imageUrl || "";
            if (!uri) return null;
            return {
              id: `${uri}#${idx}`,
              type: r.shortsUrl ? "video" : "image",
              uri,
              title: r.storeName || "스크랩 리뷰",
              description: r.description ?? "",
            };
          })
          .filter(Boolean) as ReviewItem[];
        setScraps(mapped);
      })
      .catch((err) => {
        setScrapsError(err?.message ?? "스크랩한 리뷰를 불러오지 못했습니다");
      })
      .finally(() => {
        setLoadingScraps(false);
      });
  }, [activeTab]);

  // 내가 작성한 리뷰 삭제
  const [deleting, setDeleting] = useState(false);

  function confirmDeleteCurrent() {
    if (!selectedItem) return;
    if (activeTab !== "myReviews") {
      // 스크랩 탭/메뉴판 탭에서는 삭제 비활성
      return;
    }
    Alert.alert(
      "리뷰 삭제",
      "정말 이 리뷰를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: doDeleteCurrent,
        },
      ],
      { cancelable: true }
    );
  }

  async function doDeleteCurrent() {
    if (!selectedItem) return;
    if (deleting) return;

    // ReviewItem.id가 문자열인 경우(reviewId가 문자열로 매핑됨)
    // 숫자로 변환 실패 시 안전하게 무시
    const reviewId = Number.parseInt(selectedItem.id, 10);
    if (!Number.isFinite(reviewId) || reviewId <= 0) {
      Alert.alert("삭제 실패", "유효한 리뷰 ID를 확인할 수 없습니다.");
      return;
    }

    try {
      setDeleting(true);
      console.log("[UI][DELETE] start", { reviewId });
      await deleteMyReview(reviewId);
      console.log("[UI][DELETE] ok", { reviewId });

      // detailList / myReviews 모두에서 제거
      setDetailList((prev) => prev.filter((i) => i.id !== String(reviewId)));
      setMyReviews((prev) => prev.filter((i) => i.id !== String(reviewId)));

      // 다음 아이템으로 이동하거나 닫기
      const idxBefore = detailList.findIndex((i) => i.id === String(reviewId));
      const after = detailList.filter((i) => i.id !== String(reviewId));

      if (after.length === 0) {
        // 더 이상 볼 아이템 없으면 상세 닫기
        setSelectedItem(null);
        setHeaderVisible?.(true);
        return;
      }

      const nextIndex = Math.min(idxBefore, after.length - 1);
      const nextItem = after[nextIndex];
      setSelectedItem(nextItem);

      // 스크롤 위치도 맞춰줌
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      });
    } catch (e: any) {
      console.error("[UI][DELETE] error", e);
      Alert.alert("삭제 실패", e?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  // --- [FIX 1] 상세 보기에 사용할 데이터 목록을 저장할 state 추가 ---
  const [detailList, setDetailList] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

  useEffect(() => {
    Object.values(vdoRefs.current).forEach((video) => video?.pauseAsync());
    const currentVideo = vdoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.playAsync();
    }
  }, [currentIndex]);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- [FIX 2] handleOpenDetail이 어떤 목록에서 왔는지 알 수 있도록 수정 ---
  const handleOpenDetail = (item: ReviewItem, sourceList: ReviewItem[]) => {
    setSelectedItem(item);
    setDetailList(sourceList); // 전달받은 목록으로 detailList 설정
    setHeaderVisible?.(false);
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;
  const gridSize = (width - SPACING.md * 2 - 16) / 2;

  return (
    <View style={styles.container}>
      {selectedItem ? (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <FlatList
            key="detail"
            ref={flatListRef}
            // --- [FIX 3] data 소스를 myReviews에서 detailList로 변경 ---
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
                    ref={(ref) => {
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
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    setSelectedItem(null);
                    setHeaderVisible?.(true);
                  }}
                >
                  <CloseBtn />
                </TouchableOpacity>
                <View style={[styles.textOverlay, { bottom: height * 0.1 }]}>
                  <Text style={styles.titleText}>#{item.title}</Text>
                  <Text style={styles.descText}>{item.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.dustbox}
                  onPress={deleting ? undefined : confirmDeleteCurrent}
                  disabled={deleting}
                >
                  <DustBox width={50} height={50} />
                </TouchableOpacity>
              </View>
            )}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={screenHeight}
            snapToAlignment="start"
            // --- [FIX 3] 여기도 detailList를 사용하도록 변경 ---
            initialScrollIndex={Math.max(
              0,
              detailList.findIndex((i) => i.id === selectedItem.id)
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TabNavigation
            userType="eater"
            activeTab={activeTab}
            onTabPress={(tabKey) => setActiveTab(tabKey as TabKey)}
          />
          <View style={styles.tabContent}>
            {activeTab === "myReviews" &&
              (loadingMyReviews ? (
                <EmptyState message="내 리뷰 불러오는 중..." icon={EmptyIcon} />
              ) : myReviewsError ? (
                <EmptyState message={myReviewsError} icon={EmptyIcon} />
              ) : myReviews.length > 0 ? (
                <View style={styles.gridContainer}>
                  {myReviews.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={myReviews.length}
                      // --- [FIX 4] 클릭 시 myReviews 목록을 전달 ---
                      onPress={() => handleOpenDetail(item, myReviews)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  message="내가 남긴 리뷰가 없습니다"
                  icon={EmptyIcon}
                />
              ))}
            {activeTab === "scrappedReviews" &&
              (loadingScraps ? (
                <EmptyState message="스크랩 리뷰 로딩중..." icon={EmptyIcon} />
              ) : scrapsError ? (
                <EmptyState message={scrapsError} icon={EmptyIcon} />
              ) : scraps.length > 0 ? (
                <View style={styles.gridContainer}>
                  {scraps.map((item, index) => (
                    <MypageGridComponent
                      key={item.id}
                      item={item}
                      size={gridSize}
                      index={index}
                      totalLength={scraps.length}
                      // --- [FIX 4] 클릭 시 scraps 목록을 전달 ---
                      onPress={() => handleOpenDetail(item, scraps)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  message="스크랩한 리뷰가 없습니다"
                  icon={EmptyIcon}
                />
              ))}
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
    paddingVertical: SPACING.xl * 4,
  },
  emptyIcon: {
    width: "20%", // 부모 기준 비율
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
    bottom: 85,
    right: 20,
    opacity: 0.5,
  },
});
