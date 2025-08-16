import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  ViewToken,
} from "react-native";

type Poster = { uri: string; id: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  posters: Poster[]; // 최대 5개
  initialIndex?: number;
  title?: string;
};

export default function PosterPreviewModal({
  visible,
  onClose,
  posters = [],
  initialIndex = 0,
  title = "메뉴판 미리보기",
}: Props) {
  const W = Dimensions.get("window").width;
  const safeInitialIndex =
    posters.length > 0 ? Math.min(initialIndex, posters.length - 1) : 0;

  // 현재 페이지를 굳이 보여주진 않지만, FlatList 초기 위치 계산용으로 보관
  const [_page, setPage] = useState(
    posters.length > 0 ? safeInitialIndex + 1 : 0
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems?.length && viewableItems[0].index != null) {
        setPage((viewableItems[0].index as number) + 1);
      }
    }
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose} // 안드로이드 뒤로가기
    >
      {/* 바깥(백드롭) 터치 시 닫힘 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* 시트는 가운데, 바깥 터치 이벤트와 분리 */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>닫기</Text>
            </TouchableOpacity>
          </View>

          {posters.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              initialScrollIndex={safeInitialIndex}
              getItemLayout={(_, index) => ({
                length: W - 32,
                offset: (W - 32) * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged.current}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={1}
              windowSize={3}
              data={posters}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: W - 32,
                    height: (W - 32) * 1.414,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              )}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text>표시할 메뉴판이 없습니다.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 전체 화면을 덮는 어두운 백드롭
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  // 중앙 정렬 래퍼(백드롭 위에 얹힘)
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  // 내용 시트
  sheet: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: "700" },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  closeTxt: { color: "#007AFF", fontWeight: "600" },
  emptyBox: {
    height: 300,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});
