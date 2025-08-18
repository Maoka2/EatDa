import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { getStoreMenus, MenuData } from "./Menu/services/api";
import NoDataScreen from "../../components/NoDataScreen";
import ResultModal from "../../components/ResultModal";

type PosterThumb = { id: string; uri: string };

type Props = {
  storeId: number;
  accessToken: string;

  /** 하단 썸네일 스트립에 표시할 '선물받은(혹은 채택된) 메뉴판'들. 최대 5개까지만 사용됨 */
  giftedPosters?: PosterThumb[];
  /** 썸네일 클릭 시 상위로 전달 → 상위에서 PosterPreviewModal 열기 */
  onPosterPress?: (index: number, posters: PosterThumb[]) => void;

  /** 데이터 로딩 완료시 상위로 메뉴 리스트 전달(선택) */
  onDataLoaded?: (list: MenuData[]) => void;
};

export default function StoreMenuScreen({
  storeId,
  accessToken,
  giftedPosters = [],
  onPosterPress,
  onDataLoaded,
}: Props) {
  const [menuData, setMenuData] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [brokenMap, setBrokenMap] = useState<Record<string, boolean>>({});

  // ResultModal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalMessage, setModalMessage] = useState("");

  const openErrorModal = (msg: string) => {
    setModalType("failure");
    setModalMessage(msg);
    setModalVisible(true);
  };
  const handleModalClose = () => setModalVisible(false);

  // 실제 메뉴 데이터 가져오기
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const sid = typeof storeId === "string" ? Number(storeId) : storeId;
        if (!Number.isFinite(sid)) {
          console.warn("[STORE-MENU][SCREEN] invalid storeId:", storeId);
          setMenuData([]);
          setFetchedOnce(true);
          onDataLoaded?.([]);
          return;
        }

        const menus = await getStoreMenus(sid, accessToken);

        // id 보정 (혹시 id 누락 케이스 방지)
        const adjusted = menus.map((menu, index) => ({
          ...menu,
          id:
            (menu as any).id === undefined ||
            (menu as any).id === null ||
            (menu as any).id === 0
              ? index + 1
              : (menu as any).id,
        }));

        setMenuData(adjusted);
        setFetchedOnce(true);
        onDataLoaded?.(adjusted);
      } catch (error: any) {
        console.error("[STORE-MENU][SCREEN] fetch error:", error);
        openErrorModal("메뉴를 불러오는데 실패했습니다. 다시 시도해주세요.");
        setFetchedOnce(true);
        onDataLoaded?.([]);
      } finally {
        setLoading(false);
      }
    };

    if (storeId && accessToken) fetchMenuData();
  }, [storeId, accessToken, onDataLoaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getStoreMenus(storeId, accessToken);
      const adjusted = list.map((menu, index) => ({
        ...menu,
        id:
          (menu as any).id === undefined ||
          (menu as any).id === null ||
          (menu as any).id === 0
            ? index + 1
            : (menu as any).id,
      }));
      setMenuData(Array.isArray(adjusted) ? adjusted : []);
      onDataLoaded?.(Array.isArray(adjusted) ? adjusted : []);
      setBrokenMap({}); // 새로고침 시 실패 캐시 초기화
    } catch (e) {
      console.warn("[StoreMenu] refresh failed:", e);
      openErrorModal("새로고침에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setRefreshing(false);
    }
  }, [storeId, accessToken, onDataLoaded]);

  const posterStrip = (giftedPosters || []).slice(0, 5);

  if (fetchedOnce && !loading && menuData.length === 0) {
    return (
      <>
        <NoDataScreen />
        <ResultModal
          visible={modalVisible}
          type={modalType}
          message={modalMessage}
          onClose={handleModalClose}
        />
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {loading && !fetchedOnce ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* 메뉴 리스트 */}
          <FlatList<MenuData>
            data={menuData}
            keyExtractor={(m, idx) => `${storeId}-${m.name}-${idx}`}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{
              paddingVertical: 8,
              paddingBottom: posterStrip.length > 0 ? 80 : 16,
            }}
            renderItem={({ item }) => {
              const idKey = String((item as any).id ?? item.name);
              const showPlaceholder =
                !item.imageUrl || brokenMap[idKey] === true;

              return (
                <View style={styles.row}>
                  {showPlaceholder ? (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  ) : (
                    <Image
                      source={{ uri: item.imageUrl! }}
                      style={styles.thumb}
                      onError={() =>
                        setBrokenMap((prev) => ({ ...prev, [idKey]: true }))
                      }
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {typeof item.price === "number" ? (
                      <Text style={styles.price}>
                        {item.price.toLocaleString()}원
                      </Text>
                    ) : null}
                    {item.description ? (
                      <Text style={styles.desc}>{item.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            }}
          />

          {/* 하단: 선물받은/채택된 메뉴판 썸네일 스트립 (최대 5개) */}
          {posterStrip.length > 0 && (
            <View style={styles.posterStripWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.posterStrip}
              >
                {posterStrip.map((p, idx) => (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.9}
                    onPress={() => onPosterPress?.(idx, posterStrip)}
                    style={styles.posterItem}
                  >
                    <Image source={{ uri: p.uri }} style={styles.posterThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {/* 공통 ResultModal */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  thumb: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: "#eee" },
  name: { fontSize: 16, fontWeight: "600" },
  price: { marginTop: 2 },
  desc: { marginTop: 4, color: "#666" },

  posterStripWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  posterStrip: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  posterItem: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 6,
    backgroundColor: "#f3f4f6",
  },
  posterThumb: {
    width: "100%",
    height: "100%",
  },
});
