// src/screens/Store/StoreReviewScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import GridComponent, { ReviewItem } from "../../components/GridComponent";
import CloseBtn from "../../../assets/closeBtn.svg";
import ResultModal from "../../components/ResultModal";

// API
import { getStoreReviews } from "./Review/services/api";
import { getTokens } from "../Login/services/tokenStorage";

// ✅ 테마/아이콘 (StoreEventScreen 과 동일 스타일)
import { COLORS, SPACING } from "../../constants/theme";
const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

const EmptyState = ({ message, icon }: { message: string; icon?: any }) => (
  <View style={styles.emptyContent}>
    {icon && (
      <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />
    )}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

interface StoreReviewScreenProps {
  storeId: number; // ← 가게페이지에서 넘겨줄 것
}

export default function StoreReviewScreen({ storeId }: StoreReviewScreenProps) {
  const screenHeight = Dimensions.get("window").height;

  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { height } = useWindowDimensions();

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

  // ResultModal 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalMessage, setModalMessage] = useState("");

  const openError = (msg: string) => {
    setModalType("failure");
    setModalMessage(msg);
    setModalVisible(true);
  };

  // 스크롤 시 여러 페이지 한꺼번에 넘어가지 않게끔 조절
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

  useEffect(() => {
    Object.keys(vdoRefs.current).forEach((key) => {
      const idx = parseInt(key, 10);
      const video = vdoRefs.current[idx];
      if (!video) return;
      if (idx === currentIndex) video.playAsync();
      else video.pauseAsync();
    });
  }, [currentIndex]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleOpenDetail = (item: ReviewItem) => {
    setSelectedItem(item);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) setCurrentIndex(idx);

    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const fetchReviews = useCallback(async () => {
    try {
      if (!storeId || storeId <= 0) {
        openError("유효하지 않은 가게 ID입니다.");
        return;
      }
      setLoading(true);
      const { accessToken } = await getTokens();
      if (!accessToken) {
        openError("다시 로그인 해주세요.");
        return;
      }

      const raw = await getStoreReviews(storeId, accessToken);

      const mapped: ReviewItem[] = raw
        .map((r: any, idx: number) => {
          const isVideo = !!r?.shortsUrl && typeof r.shortsUrl === "string";
          const mediaUri: string | undefined = isVideo
            ? r.shortsUrl
            : r.imageUrl;
          if (
            !mediaUri ||
            typeof mediaUri !== "string" ||
            mediaUri.length === 0
          )
            return null;

          const idBase = r?.id != null ? String(r.id) : `${storeId}-${idx}`;
          const thumbnail: string | undefined = isVideo
            ? typeof r?.thumbnailUrl === "string"
              ? r.thumbnailUrl
              : undefined
            : typeof r?.imageUrl === "string"
            ? r.imageUrl
            : undefined;

          const item: ReviewItem = {
            id: idBase,
            type: isVideo ? "video" : "image",
            uri: mediaUri,
            thumbnail,
            title: isVideo ? "쇼츠 리뷰" : "사진 리뷰",
            description:
              typeof r?.description === "string" ? r.description : "",
          };
          return item;
        })
        .filter(Boolean) as ReviewItem[];

      setItems(mapped);
      setFetchedOnce(true);
    } catch (e: any) {
      console.log("[StoreReviewScreen] fetchReviews error:", e?.message);
      openError(
        e?.message || "리뷰 조회에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const isEmpty = fetchedOnce && items.length === 0;

  // 초기 로딩 상태
  if (loading && !fetchedOnce) {
    return (
      <>
        <EmptyState message="리뷰를 불러오는 중..." icon={EmptyIcon} />
        <ResultModal
          visible={modalVisible}
          type={modalType}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  // 빈 상태
  if (isEmpty) {
    return (
      <>
        <EmptyState message="아직 등록된 리뷰가 없습니다." icon={EmptyIcon} />
        <ResultModal
          visible={modalVisible}
          type={modalType}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  // 컨텐츠
  return (
    <View style={{ flex: 1 }}>
      {selectedItem ? (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <FlatList
            ref={flatListRef}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={{ height: screenHeight }}>
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    ref={(ref) => {
                      vdoRefs.current[index] = ref;
                    }}
                    source={{ uri: item.uri }}
                    style={{ flex: 1 }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={index === currentIndex}
                    isLooping
                    isMuted
                  />
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedItem(null)}
                >
                  <CloseBtn />
                </TouchableOpacity>

                <View style={[styles.textOverlay, { bottom: height * 0.33 }]}>
                  <Text style={styles.titleText}>#{item.title}</Text>
                  <Text style={styles.descText}>{item.description}</Text>
                </View>
              </View>
            )}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={screenHeight}
            snapToAlignment="start"
            initialScrollIndex={Math.max(
              0,
              items.findIndex((i) => i.id === selectedItem?.id)
            )}
            getItemLayout={(data, index) => ({
              length: screenHeight,
              offset: screenHeight * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            windowSize={2}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            removeClippedSubviews
          />
        </Animated.View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          numColumns={3}
          renderItem={({ item, index }) => (
            <GridComponent
              item={item}
              size={containerWidth / 3}
              index={index}
              totalLength={items.length}
              onPress={() => handleOpenDetail(item)}
            />
          )}
          refreshing={loading}
          onRefresh={fetchReviews}
          removeClippedSubviews
        />
      )}

      <ResultModal
        visible={modalVisible}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: SPACING.xl * 4,
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
});
