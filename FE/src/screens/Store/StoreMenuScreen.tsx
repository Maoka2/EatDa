import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { getStoreMenus, MenuData } from "./Menu/services/api";
import NoDataScreen from "../../components/NoDataScreen";
type Props = { storeId: number; accessToken: string }; //

export default function StoreMenuScreen({ storeId, accessToken }: Props) {
  const [menuData, setMenuData] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [error, setError] = useState<string>("");

  // 실제 메뉴 데이터 가져오기
    useEffect(() => {
      const fetchMenuData = async () => {
        try {
          setLoading(true);
          setError("");
          
          const menus = await getStoreMenus(storeId, accessToken);
          console.log("[MenuSelectStep] 받은 메뉴 데이터:", menus);
          
          // ⭐ 메뉴 ID를 1부터 시작하도록 변환 (undefined나 0 처리)
          const adjustedMenus = menus.map((menu, index) => ({
            ...menu,
            id: (menu.id === undefined || menu.id === null || menu.id === 0) ? index + 1 : menu.id
          }));
          
          console.log("[MenuSelectStep] 조정된 메뉴 데이터:", adjustedMenus);
          setMenuData(adjustedMenus);
          
        } catch (error: any) {
          console.error("메뉴 데이터 가져오기 실패:", error);
          setError(error.message || "메뉴를 불러오는데 실패했습니다.");
          Alert.alert("오류", "메뉴를 불러오는데 실패했습니다. 다시 시도해주세요.");
        } finally {
          setLoading(false);
        }
      };
  
      if (storeId && accessToken) {
        fetchMenuData();
      }
    }, [storeId, accessToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getStoreMenus(storeId, accessToken);
      setMenuData(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("[StoreMenu] refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [storeId, accessToken]);

  if (fetchedOnce && !loading && menuData.length === 0) {
    return <NoDataScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      {loading && !fetchedOnce ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={menuData}
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
