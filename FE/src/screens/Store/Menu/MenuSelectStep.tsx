// src/screens/Store/Menu/MenuSelectStep.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStoreMenus } from "./services/api";
import ResultModal from "../../../components/ResultModal";

interface MenuData {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
}

interface MenuSelectStepProps {
  selected: number[];
  onToggle: (id: number) => void;
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

  // ResultModal (에러/안내)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const openModal = useCallback(
    (type: "success" | "failure", title: string, message: string) => {
      setModalType(type);
      setModalTitle(title);
      setModalMessage(message);
      setModalVisible(true);
    },
    []
  );
  const handleModalClose = () => setModalVisible(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);

        const sid = typeof storeId === "string" ? Number(storeId) : storeId;
        if (!Number.isFinite(sid) || !accessToken) {
          setMenuData([]);
          openModal(
            "failure",
            "오류",
            "가게 정보 또는 인증 정보를 확인할 수 없습니다."
          );
          return;
        }

        const menus = await getStoreMenus(sid, accessToken);

        // id 없을 경우 카드 키 안정성 보장을 위해 fallback
        const adjusted = menus.map((menu, index) => ({
          ...menu,
          id:
            menu.id === undefined || menu.id === null || menu.id === 0
              ? index + 1
              : menu.id,
        }));

        setMenuData(adjusted);
      } catch (error: any) {
        console.error("[MENU][SELECT] fetch error:", error);
        openModal(
          "failure",
          "오류",
          error?.message || "메뉴를 불러오는데 실패했습니다. 다시 시도해주세요."
        );
      } finally {
        setLoading(false);
      }
    };

    if (storeId && accessToken) fetchMenuData();
  }, [storeId, accessToken, openModal]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={{ marginTop: 10, color: "#333" }}>
          메뉴를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 뒤로가기 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>메뉴 선택</Text>
        <Text style={styles.subtitle}>
          메뉴판 생성에 참고할 메뉴를 선택해주세요
        </Text>
      </View>

      <FlatList
        data={menuData}
        keyExtractor={(item) => `${storeId}-${item.id}`} // ✅ id 기반으로 안정적 키
        extraData={selected}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text style={{ color: "#666" }}>등록된 메뉴가 없습니다.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSel = selected.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, isSel && styles.cardSelected]}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri:
                    item.imageUrl && item.imageUrl.length > 0
                      ? item.imageUrl
                      : "https://via.placeholder.com/80?text=No+Img",
                }}
                style={styles.menuImage}
                resizeMode="cover"
              />
              <View style={styles.menuText}>
                <Text style={styles.menuName} numberOfLines={1}>
                  {item.name}
                </Text>
                {!!item.description && (
                  <Text style={styles.menuDesc} numberOfLines={2}>
                    {item.description}
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

      {/* 하단 확인 버튼 */}
      <View style={styles.absoluteBottom}>
        <TouchableOpacity
          style={[styles.button, !selected.length && styles.buttonDisabled]}
          onPress={selected.length > 0 ? onNext : undefined}
          disabled={!selected.length}
          activeOpacity={selected.length > 0 ? 0.7 : 1}
        >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>

      {/* 공통 ResultModal */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  backButton: { position: "absolute", top: 40, left: 16, zIndex: 10 },
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
  subtitle: { fontSize: 14, color: "#666666", textAlign: "center" },
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
    backgroundColor: "#F5F5F5",
  },
  menuText: { flex: 1, paddingRight: 12 },
  menuName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  menuDesc: { fontSize: 13, color: "#666666", lineHeight: 18, marginTop: 2 },
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
  checkWrapSelected: { backgroundColor: "#FF69B4", borderColor: "#FF69B4" },
  check: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
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
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
