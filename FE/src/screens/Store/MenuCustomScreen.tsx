// src/screens/Store/MenuCustomScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
} from "react-native";

import LoadingSpinner from "../../components/LoadingSpinner";

interface MenuCustomScreenProps {
  onClose: () => void;
}

interface MenuStyle {
  id: string;
  name: string;
  preview: string;
}

export default function MenuCustomScreen({ onClose }: MenuCustomScreenProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const menuStyles: MenuStyle[] = [
    { id: "coffee", name: "Coffee", preview: "☕" },
    { id: "casual", name: "카페 메뉴", preview: "🍰" },
    { id: "formal", name: "Menu", preview: "🍽️" },
  ];

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleGenerate = () => {
    if (!selectedStyle) {
      alert("메뉴 스타일을 선택해주세요.");
      return;
    }

    setIsGenerating(true);

    // 메뉴판 생성 시뮬레이션
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 3000);
  };

  const handleSave = () => {
    alert("메뉴판이 저장되었습니다!");
    onClose();
  };

  if (isGenerating) {
    return <LoadingSpinner message="메뉴판을 생성중입니다..." />;
  }

  if (showResult) {
    return (
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowResult(false)}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>메뉴판 생성 완료</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 생성된 메뉴판 미리보기 */}
          <View style={styles.previewContainer}>
            <View style={styles.menuPreview}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>햄찌네 피자</Text>
                <Text style={styles.menuSubtitle}>
                  🍕 맛있는 피자를 만나보세요
                </Text>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuCategoryTitle}>🍕 피자 메뉴</Text>
                <View style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>페퍼로니 피자</Text>
                    <Text style={styles.menuItemDesc}>
                      매콤한 페퍼로니와 치즈의 환상적인 조합
                    </Text>
                  </View>
                  <Text style={styles.menuItemPrice}>24,000원</Text>
                </View>
                <View style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>마르게리타 피자</Text>
                    <Text style={styles.menuItemDesc}>
                      신선한 토마토와 바질, 모짜렐라 치즈
                    </Text>
                  </View>
                  <Text style={styles.menuItemPrice}>22,000원</Text>
                </View>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuCategoryTitle}>🥤 음료</Text>
                <View style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>콜라</Text>
                    <Text style={styles.menuItemDesc}>시원한 탄산음료</Text>
                  </View>
                  <Text style={styles.menuItemPrice}>3,000원</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 완료 메시지 */}
          <View style={styles.completeMessage}>
            <Text style={styles.completeTitle}>🎉 메뉴판 생성 완료!</Text>
            <Text style={styles.completeDesc}>
              생성된 메뉴판을 확인하고 저장해보세요.
            </Text>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={() => setShowResult(false)}
          >
            <Text style={styles.regenerateButtonText}>다시 생성하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>메뉴판 꾸미기</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 설명 */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>
            AI가 메뉴판을 꾸며드립니다
          </Text>
          <Text style={styles.descriptionText}>
            원하는 스타일을 선택하면 AI가 자동으로 예쁜 메뉴판을 만들어드려요.
          </Text>
        </View>

        {/* 스타일 선택 */}
        <View style={styles.styleSection}>
          <Text style={styles.sectionTitle}>메뉴판 스타일을 선택하세요</Text>

          <View style={styles.styleGrid}>
            {menuStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyle === style.id && styles.selectedStyleCard,
                ]}
                onPress={() => handleStyleSelect(style.id)}
              >
                <View style={styles.stylePreview}>
                  <Text style={styles.styleEmoji}>{style.preview}</Text>
                </View>
                <Text style={styles.styleName}>{style.name}</Text>
                {selectedStyle === style.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 미리보기 */}
        {selectedStyle && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>미리보기</Text>
            <View style={styles.miniPreview}>
              <Text style={styles.previewText}>
                선택하신 스타일로 메뉴판이 생성됩니다
              </Text>
              <Text style={styles.previewEmoji}>
                {menuStyles.find((s) => s.id === selectedStyle)?.preview}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            !selectedStyle && styles.disabledButton,
          ]}
          onPress={handleGenerate}
          disabled={!selectedStyle}
        >
          <Text style={styles.generateButtonText}>메뉴판 생성하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  } as ViewStyle,
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  } as ViewStyle,
  closeButton: {
    fontSize: 24,
    color: "#333",
  } as TextStyle,
  backButton: {
    fontSize: 20,
    color: "#333",
  } as TextStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  } as TextStyle,
  placeholder: {
    width: 24,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: 20,
  } as ViewStyle,
  descriptionContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  } as ViewStyle,
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  } as TextStyle,
  descriptionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  } as TextStyle,
  styleSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  } as TextStyle,
  styleGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  } as ViewStyle,
  styleCard: {
    flex: 1,
    backgroundColor: "#F7F8F9",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  } as ViewStyle,
  selectedStyleCard: {
    borderColor: "#FF69B4",
    backgroundColor: "#FFF0F5",
  } as ViewStyle,
  stylePreview: {
    width: 50,
    height: 50,
    backgroundColor: "white",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  } as ViewStyle,
  styleEmoji: {
    fontSize: 24,
  } as TextStyle,
  styleName: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  } as TextStyle,
  selectedIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FF69B4",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  checkMark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  } as TextStyle,
  previewSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  } as ViewStyle,
  miniPreview: {
    backgroundColor: "#F7F8F9",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  } as ViewStyle,
  previewText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  } as TextStyle,
  previewEmoji: {
    fontSize: 30,
  } as TextStyle,
  bottomButtons: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    flexDirection: "row",
    gap: 10,
  } as ViewStyle,
  generateButton: {
    flex: 1,
    backgroundColor: "#FF69B4",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  } as ViewStyle,
  disabledButton: {
    backgroundColor: "#CCC",
  } as ViewStyle,
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  regenerateButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginRight: 5,
  } as ViewStyle,
  regenerateButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  saveButton: {
    flex: 1,
    backgroundColor: "#FF69B4",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginLeft: 5,
  } as ViewStyle,
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  previewContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  } as ViewStyle,
  menuPreview: {
    backgroundColor: "#FFFEF7",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  } as ViewStyle,
  menuHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  } as ViewStyle,
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  } as TextStyle,
  menuSubtitle: {
    fontSize: 14,
    color: "#666",
  } as TextStyle,
  menuSection: {
    marginBottom: 20,
  } as ViewStyle,
  menuCategoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  } as TextStyle,
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  } as ViewStyle,
  menuItemInfo: {
    flex: 1,
  } as ViewStyle,
  menuItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  } as TextStyle,
  menuItemDesc: {
    fontSize: 12,
    color: "#666",
  } as TextStyle,
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF69B4",
  } as TextStyle,
  completeMessage: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 20,
    alignItems: "center",
  } as ViewStyle,
  completeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  } as TextStyle,
  completeDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  } as TextStyle,
});
