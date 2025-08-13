import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getStoreMenu, StoreMenuItem } from "./Menu/services/api";
import NoDataScreen from "../../components/NoDataScreen";

type Props = { storeId: number }; // ✅ 정확한 prop 이름: storeId

export default function StoreMenuScreen({ storeId }: Props) {
  const [items, setItems] = useState<StoreMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const fetchMenus = useCallback(async () => {
    if (!Number.isFinite(storeId) || storeId <= 0) {
      setItems([]);
      setFetchedOnce(true);
      return;
    }

    setLoading(true);
    const t0 = Date.now();
    try {
      const list = await getStoreMenu(storeId);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("[StoreMenu] fetch failed:", e);
      setItems([]);
    } finally {
      setFetchedOnce(true);
      setLoading(false);
      console.log(
        `[StoreMenu] fetch done (storeId=${storeId}, ${Date.now() - t0}ms)`
      );
    }
  }, [storeId]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getStoreMenu(storeId);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("[StoreMenu] refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [storeId]);

  if (fetchedOnce && !loading && items.length === 0) {
    return <NoDataScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      {loading && !fetchedOnce ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m, idx) => `${storeId}-${m.name}-${idx}`} // 
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>
                  {item.price.toLocaleString()}원
                </Text>
                {item.description ? (
                  <Text style={styles.desc}>{item.description}</Text>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
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
});
