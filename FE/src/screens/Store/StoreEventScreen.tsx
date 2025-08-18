// src/screens/Store/StoreEventScreen.tsx
import React, { useEffect, useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";
import GridComponent, { eventItem } from "../../components/GridComponent";
import DetailEventScreen from "./DetailEventScreen";
import NoDataScreen from "../../components/NoDataScreen";
import { COLORS, SPACING } from "../../constants/theme";
import { getMyEvents, getStoreEvents } from "../EventMaking/services/api";
const EmptyIcon = require("../../../assets/blue-box-with-red-button-that-says-x-it 1.png");

const EmptyState = ({ message, icon }: { message: string; icon?: any }) => (
  <View style={styles.emptyContent}>
    {icon && (
      <Image source={icon} style={styles.emptyIcon} resizeMode="contain" />
    )}
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

type ApiItem = {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string;
  postUrl: string;
  storeName?: string;
  description?: string;
};

const adapt = (a: ApiItem): eventItem => ({
  id: String(a.eventId),
  eventName: a.title,
  description: a.description ?? "",
  uri: { uri: a.postUrl },
  start_date: new Date(a.startAt),
  end_date: new Date(a.endAt),
  storeName: a.storeName ?? "",
});

// 유효한 이미지만
const toItems = (list: ApiItem[]): eventItem[] =>
  list.map(adapt).filter((it) => {
    const uri = (it.uri as any)?.uri;
    return typeof uri === "string" && uri.trim().length > 0;
  });

type Props = {
  /** 가게 상세에서 쓰면 넣기(읽기 전용) */
  storeId?: number;
  /** 내 가게 탭이면 true(삭제 가능) */
  canDelete?: boolean;
};

export default function StoreEventScreen({
  storeId,
  canDelete = false,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [items, setItems] = useState<eventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fetchFirst = useCallback(async () => {
    setLoading(true);
    try {
      const list: ApiItem[] = canDelete
        ? await getMyEvents()
        : await getStoreEvents(storeId!);
      setItems(toItems(list));
      if (list?.[0]) console.log("[StoreEvent] first item:", list[0]);
    } catch (e) {
      console.warn("[StoreEvent] fetch failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, canDelete]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list: ApiItem[] = canDelete
        ? await getMyEvents()
        : await getStoreEvents(storeId!);
      setItems(toItems(list));
    } catch (e) {
      console.warn("[StoreEvent] refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [storeId, canDelete]);

  const isEmpty = !loading && items.length === 0;
  const tile = Math.floor(containerWidth / 3);

  if (isEmpty) {
    return (
      <EmptyState message="진행중인 이벤트가 없습니다." icon={EmptyIcon} />
    );
  }

  if (selectedIndex !== null) {
    return (
      <DetailEventScreen
        events={items}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onDeleted={(deletedId) => {
          setItems((prev) => prev.filter((it) => it.id !== deletedId));
          setSelectedIndex(null);
        }}
        canDelete={canDelete} // ✅ 내 가게일 때만 삭제 노출
        storeId={storeId}
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
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
