// 4. WriteStep.tsx
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
}

export default function WriteStep({
  isGenerating,
  aiDone,
  text,
  onChange,
  onNext,
  onBack,
  onClose,
}: WriteProps) {
  const { width } = useWindowDimensions();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // AI 생성이 완료되면 더미 콘텐츠 설정
  useEffect(() => {
    if (aiDone && !generatedContent) {
      // 더미 AI 생성 결과 (햄스터 요리사 영상)
      setGeneratedContent(
        "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop"
      );
    }
  }, [aiDone, generatedContent]);

  // AI 생성 완료 & 텍스트 리뷰 작성 완료 체크
  const canComplete = aiDone && text.trim().length > 0;

  const handleComplete = () => {
    if (canComplete) {
      setShowCompleteModal(true);
    }
  };

  const handleModalConfirm = () => {
    setShowCompleteModal(false);
    onNext(); // 최종 완료
  };

  const handleModalCancel = () => {
    setShowCompleteModal(false);
    // 모달만 닫고 현재 화면 유지
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>햄찌네 피자</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={width * 0.06} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI 생성 상태 섹션 */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI 리뷰 생성</Text>

          {isGenerating && (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require("../../../../assets/AI-loading.json")}
                autoPlay
                loop
                style={styles.lottie}
                duration={5000}
              />
              <Text style={styles.loadingText}>AI 리뷰를 생성중입니다...</Text>
              <Text style={styles.loadingSubText}>
                약간의 시간이 소요됩니다
              </Text>
            </View>
          )}

          {aiDone && (
            <View style={styles.aiCompleteContainer}>
              <View style={styles.aiCompleteIcon}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.aiCompleteText}>
                AI 리뷰 생성이 완료되었습니다!
              </Text>
              <Text style={styles.aiCompleteSubText}>
                리뷰가 완성되면 결과를 확인할 수 있습니다
              </Text>
            </View>
          )}
        </View>

        {/* 텍스트 리뷰 작성 섹션 */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>텍스트 리뷰 작성</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={`가게 음식에 대한 리뷰를 자유롭게 작성해주세요!
텍스트 리뷰는 AI 생성 리뷰 위에 투명하게 표시될 예정입니다.
텍스트 리뷰 작성과 AI 리뷰 생성이 모두 완료되면 
완료 버튼을 눌러주세요!`}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={text}
            onChangeText={onChange}
            maxLength={500}
          />

          <View style={styles.textCounter}>
            <Text style={styles.counterText}>{text.length}/500</Text>
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
              ? "AI 리뷰 생성 중..."
              : !text.trim()
              ? "텍스트 리뷰를 작성해주세요"
              : "완료"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 완료 모달 */}
      <CompleteModal
        visible={showCompleteModal}
        onClose={handleModalCancel}
        generatedContent={generatedContent}
        onConfirm={onNext}
        reviewText={text}
        contentType="video"
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

  // AI 섹션
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
  },

  // 텍스트 섹션
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
    fontSize: 12,
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

  // 하단 버튼
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
