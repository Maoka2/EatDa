// src/screens/Store/StoreEventScreen.tsx
import React, { useEffect, useCallback, useState } from "react";
import { View, Text, FlatList } from "react-native";
import GridComponent, { eventItem } from "../../components/GridComponent";
import DetailEventScreen from "./DetailEventScreen";
import NoDataScreen from "../../components/NoDataScreen";
import { getMyEvents } from "../EventMaking/services/api";

type MyEventApiItem = {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string;
  postUrl: string;
  storeName?: string;
  description?: string;
};

const adapt = (a: MyEventApiItem): eventItem => ({
  id: String(a.eventId),
  eventName: a.title,
  description: a.description ?? "",
  uri: a.postUrl,
  start_date: new Date(a.startAt),
  end_date: new Date(a.endAt),
  storeName: a.storeName ?? "",
});

// ⬇️ 매핑 + (옵션) 유효 이미지 필터링
const toItems = (list: MyEventApiItem[]): eventItem[] =>
  list.map(adapt).filter((it) => {
    const uri = (it.uri as any)?.uri;
    return uri && String(uri).trim().length > 0; // 필요 시 isDeleted 같은 플래그도 함께 체크
  });

export default function StoreEventScreen() {
  const [containerWidth, setContainerWidth] = useState(0);
  const [items, setItems] = useState<eventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fetchFirst = useCallback(async () => {
    setLoading(true);
    try {
      const list: MyEventApiItem[] = await getMyEvents();
      setItems(toItems(list)); // ⬅️ 여기
      if (list?.[0]) console.log("[StoreEvent] first item:", list[0]);
    } catch (e) {
      console.warn("[StoreEvent] getMyEvents failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list: MyEventApiItem[] = await getMyEvents();
      setItems(toItems(list)); // ⬅️ 여기
    } catch (e) {
      console.warn("[StoreEvent] refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const isEmpty = !loading && items.length === 0;
  const tile = Math.floor(containerWidth / 3);

  if (isEmpty) return <NoDataScreen />;

  if (selectedIndex !== null) {
    return (
      <DetailEventScreen
        events={items}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        // ⬇️ 삭제 성공 시 목록에서 제거 + 상세 닫기
        onDeleted={(deletedId) => {
          setItems((prev) => prev.filter((it) => it.id !== deletedId));
          setSelectedIndex(null);
        }}
      />
    );
  }

  return (
    <View
      style={{ flex: 1, marginVertical: 10 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {tile > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item, index }) => (
            <GridComponent
              item={item}
              size={tile}
              index={index}
              totalLength={items.length}
              onPress={() => setSelectedIndex(index)}
            />
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ textAlign: "center" }}>불러오는 중…</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
