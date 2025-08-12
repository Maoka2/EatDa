// WriteStep.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import CompleteModal from "./CompleteModal";

interface WriteProps {
  isGenerating: boolean;
  aiDone: boolean;
  text: string;
  onChange: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  generatedAssetUrl?: string | null;
  generatedAssetType?: string | null; // ⭐ 추가
}

export default function WriteStep({
  isGenerating,
  aiDone,
  text,
  onChange,
  onNext,
  onBack,
  onClose,
  generatedAssetUrl,
  generatedAssetType, // ⭐ 추가
}: WriteProps) {
  const { width } = useWindowDimensions();
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // AI 생성 완료 & 텍스트 리뷰 30자 이상 체크
  const canComplete = aiDone && text.trim().length >= 30;

  const handleComplete = () => {
    if (text.trim().length < 30) {
      return;
    }
    
    if (canComplete) {
      setShowCompleteModal(true);
    }
  };

  const handleModalConfirm = () => {
    setShowCompleteModal(false);
    onNext(); // 최종 완료 - 실제 API 호출
  };

  const handleModalCancel = () => {
    setShowCompleteModal(false);
  };

  // API 타입을 모달용 타입으로 변환
  const getContentTypeForModal = (): "IMAGE" | "SHORTS_RAY_2" | "SHORTS_GEN_4" | null => {
    if (!generatedAssetType) {
      console.log("[WriteStep] generatedAssetType이 없음");
      return null;
    }
    
    // API에서 받은 타입을 그대로 사용
    if (["IMAGE", "SHORTS_RAY_2", "SHORTS_GEN_4"].includes(generatedAssetType)) {
      console.log("[WriteStep] 유효한 contentType:", generatedAssetType);
      return generatedAssetType as "IMAGE" | "SHORTS_RAY_2" | "SHORTS_GEN_4";
    }
    
    console.log("[WriteStep] 알 수 없는 generatedAssetType:", generatedAssetType);
    return null;
  };

  const contentType = getContentTypeForModal();
  const isVideo = contentType === "SHORTS_RAY_2" || contentType === "SHORTS_GEN_4";

  // 디버깅용 로그
  useEffect(() => {
    console.log("[WriteStep] State update:", {
      isGenerating,
      aiDone,
      generatedAssetUrl: generatedAssetUrl ? "있음" : "없음",
      generatedAssetType,
      contentType,
      isVideo
    });
  }, [isGenerating, aiDone, generatedAssetUrl, generatedAssetType, contentType, isVideo]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>리뷰 작성</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={width * 0.06} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI 생성 상태 섹션 */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>
            {isVideo ? "AI 쇼츠 생성" : "AI 이미지 생성"}
          </Text>

          {isGenerating && (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require("../../../../assets/AI-loading.json")}
                autoPlay
                loop
                style={styles.lottie}
                duration={5000}
              />
              <Text style={styles.loadingText}>
                {isVideo ? "AI 쇼츠를 생성중입니다..." : "AI 이미지를 생성중입니다..."}
              </Text>
              <Text style={styles.loadingSubText}>
                {isVideo ? "쇼츠 생성에는 2~5분 정도 소요됩니다" : "이미지 생성에는 1~3분 정도 소요됩니다"}
              </Text>
            </View>
          )}

          {aiDone && (
            <View style={styles.aiCompleteContainer}>
              <View style={styles.aiCompleteIcon}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.aiCompleteText}>
                {isVideo ? "AI 쇼츠 생성이 완료되었습니다!" : "AI 이미지 생성이 완료되었습니다!"}
              </Text>
              <Text style={styles.aiCompleteSubText}>
                생성된 결과를 확인하고 텍스트 리뷰를 작성해주세요
              </Text>
              {generatedAssetUrl && (
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={() => {
                    console.log("[WriteStep] 미리보기 버튼 클릭:", {
                      generatedAssetUrl,
                      contentType
                    });
                    setShowCompleteModal(true);
                  }}
                >
                  <Text style={styles.previewButtonText}>
                    {isVideo ? "🎬 쇼츠 미리보기" : "🖼️ 이미지 미리보기"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 텍스트 리뷰 작성 섹션 */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>텍스트 리뷰 작성</Text>
          <Text style={styles.sectionSubtitle}>
            최소 30자 이상 작성해주세요
          </Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={`가게 음식에 대한 리뷰를 자유롭게 작성해주세요!

예시:
- 음식의 맛, 양, 가격에 대한 솔직한 평가
- 가게 분위기나 서비스에 대한 경험
- 다른 고객들에게 도움이 될 정보

최소 30자 이상 작성해야 리뷰를 등록할 수 있습니다.`}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={text}
            onChangeText={onChange}
            maxLength={500}
          />

          <View style={styles.textCounter}>
            <Text style={[
              styles.counterText,
              text.length < 30 && styles.counterTextWarning
            ]}>
              {text.length}/500 {text.length < 30 ? `(${30 - text.length}자 더 필요)` : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 완료 버튼 */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            !canComplete && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!canComplete}
          activeOpacity={canComplete ? 0.7 : 1}
        >
          <Text style={styles.completeButtonText}>
            {!aiDone
              ? isVideo ? "AI 쇼츠 생성 중..." : "AI 이미지 생성 중..."
              : text.length < 30
              ? `텍스트 리뷰 ${30 - text.length}자 더 입력해주세요`
              : "리뷰 등록하기"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 완료 모달 - 실제 생성된 콘텐츠와 타입 전달 */}
      <CompleteModal
        visible={showCompleteModal}
        onClose={handleModalCancel}
        generatedContent={generatedAssetUrl} // ⭐ 실제 생성된 URL
        contentType={contentType} // ⭐ 실제 생성된 타입
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  aiSection: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  lottie: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666666",
  },
  aiCompleteContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  aiCompleteIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffe2f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 24,
    color: "#FF69B4",
    fontWeight: "bold",
  },
  aiCompleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  aiCompleteSubText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 16,
  },
  previewButton: {
    backgroundColor: "#FF69B4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  previewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  textSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 100,
  },
  textInput: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  textCounter: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  counterText: {
    fontSize: 12,
    color: "#999999",
  },
  counterTextWarning: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  completeButton: {
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
  completeButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});