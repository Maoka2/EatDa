// 2. MenuSelectStep.tsx
import React, { useState, useEffect } from "react";
import {
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStoreMenus } from "./services/api";

// API 응답에 맞는 메뉴 데이터 타입
interface MenuData {
  id: number; // API 명세서에 맞춰 number로 변경
  name: string;
  description: string;
  imageUrl?: string;
  price?: number;
}

interface MenuSelectStepProps {
  selected: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  storeId: number;
  accessToken: string;
}

export default function MenuSelectStep({
  selected,
  onToggle,
  onBack,
  onNext,
  storeId,
  accessToken,
}: MenuSelectStepProps) {
  const { width } = useWindowDimensions();
  const [menuData, setMenuData] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 재시도 함수
  const handleRetry = () => {
    setError("");
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const menus = await getStoreMenus(storeId, accessToken);
        
        // ⭐ 메뉴 ID를 1부터 시작하도록 변환 (undefined나 0 처리)
        const adjustedMenus = menus.map((menu, index) => ({
          ...menu,
          id: (menu.id === undefined || menu.id === null || menu.id === 0) ? index + 1 : menu.id
        }));
        
        setMenuData(adjustedMenus);
        setError("");
      } catch (error: any) {
        setError(error.message || "메뉴를 불러오는데 실패했습니다.");
        Alert.alert("오류", "메뉴를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>메뉴를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || menuData.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>
          {error || "등록된 메뉴가 없습니다"}
        </Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={styles.backButtonAlternative}>
          <Text style={styles.backButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>메뉴 선택</Text>
        <Text style={styles.subtitle}>리뷰에 참고할 메뉴를 선택해주세요</Text>
      </View>

      <FlatList
        data={menuData}
        keyExtractor={(item, index) => {
          // ⭐ 안전한 키 생성
          if (item && typeof item.id === 'number') {
            return `menu-${item.id}`;
          }
          return `menu-fallback-${index}`;
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          // ⭐ ID 안전성 체크 추가
          if (!item || item.id === undefined || item.id === null) {
            console.warn("[MenuSelectStep] 유효하지 않은 메뉴 아이템:", item);
            return null; // 렌더링하지 않음
          }
          
          const itemId = item.id.toString();
          const isSel = selected.includes(itemId);
          
          console.log(`[MenuSelectStep] 메뉴 렌더링: ID=${item.id}, itemId=${itemId}, selected=${isSel}`);
          
          return (
            <TouchableOpacity
              style={[styles.card, isSel && styles.cardSelected]}
              onPress={() => {
                console.log(`[MenuSelectStep] 메뉴 선택: ${itemId}`);
                onToggle(itemId);
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: item.imageUrl ?? "https://via.placeholder.com/80?text=No+Img",
                }}
                style={styles.menuImage}
              />
              <View style={styles.menuText}>
                <Text style={styles.menuName}>{item.name || "메뉴명 없음"}</Text>
                <Text style={styles.menuDesc} numberOfLines={2}>
                  {item.description || "설명 없음"}
                </Text>
                {item.price && (
                  <Text style={styles.menuPrice}>
                    {item.price.toLocaleString()}원
                  </Text>
                )}
              </View>
              <View
                style={[styles.checkWrap, isSel && styles.checkWrapSelected]}
              >
                {isSel && <Text style={styles.check}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 확인 버튼 */}
      <View style={styles.absoluteBottom}>
        <TouchableOpacity
          style={[styles.button, !selected.length && styles.buttonDisabled]}
          onPress={() => {
            if (selected.length > 0) {
              console.log("[MenuSelectStep] 선택된 메뉴 IDs:", selected);
              onNext();
            }
          }}
          disabled={!selected.length}
          activeOpacity={selected.length > 0 ? 0.7 : 1}
        >
          <Text style={styles.buttonText}>
            확인 {selected.length > 0 && `(${selected.length}개 선택)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FF69B4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonAlternative: {
    backgroundColor: "#666666",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginVertical: 6,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#FF69B4",
    backgroundColor: "#FFF8FC",
    shadowColor: "#FF69B4",
    shadowOpacity: 0.15,
  },
  menuImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    paddingRight: 12,
  },
  menuName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    marginTop: 2,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF69B4",
    marginTop: 4,
  },
  // ⭐ 디버깅용 스타일 (나중에 제거 가능)
  debugId: {
    fontSize: 10,
    color: "#999999",
    marginTop: 2,
    fontStyle: "italic",
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkWrapSelected: {
    backgroundColor: "#FF69B4",
    borderColor: "#FF69B4",
  },
  check: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  absoluteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    zIndex: 10,
  },
  button: {
    backgroundColor: "#FF69B4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});