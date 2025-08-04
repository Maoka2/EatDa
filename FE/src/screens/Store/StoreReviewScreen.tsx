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
import { reviewData } from "../../data/reviewData";
import NoDataScreen from "../../components/NoDataScreen";

interface StoreReviewScreenProps {
  //   storeId: string;
}

export default function StoreReviewScreen() {
  const screenHeight = Dimensions.get("window").height;

  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { height } = useWindowDimensions();

  const flatListRef = useRef<FlatList<ReviewItem>>(null);
  const vdoRefs = useRef<{ [key: number]: Video | null }>({});

  // 리뷰 더미데이터 사용
  const storeReviewData: ReviewItem[] = reviewData;

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
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const isEmpty = !reviewData || reviewData.length === 0;

  return isEmpty ? (
    <NoDataScreen></NoDataScreen>
  ) : (
    <View style={{ flex: 1 }}>
      {selectedItem ? (
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          {/* 상세보기 */}
          <FlatList
            ref={flatListRef}
            data={storeReviewData}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={{ height: screenHeight }}>
                {/* 이미지리뷰인 경우 */}
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                ) : (
                  // 비디오 리뷰의 경우
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
                {/* 닫기 버튼 */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedItem(null)}
                >
                  <CloseBtn></CloseBtn>
                </TouchableOpacity>
                <View style={[styles.textOverlay, { bottom: height * 0.25 }]}>
                  <Text style={styles.titleText}>#{item.title}</Text>
                  <Text style={styles.descText}>{item.description}</Text>
                </View>
              </View>
            )}
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={screenHeight}
            snapToAlignment="start"
            initialScrollIndex={storeReviewData.findIndex(
              (i) => i.id === selectedItem?.id
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
        // 전체 보기
        <FlatList
          data={storeReviewData}
          keyExtractor={(item) => item.id}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          numColumns={3}
          renderItem={({ item, index }) => (
            <GridComponent
              item={item}
              size={containerWidth / 3}
              index={index}
              totalLength={storeReviewData.length}
              onPress={() => handleOpenDetail(item)}
            />
          )}
        />
      )}
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
});
