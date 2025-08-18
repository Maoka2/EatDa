// src/screens/EventMaking/WriteStep.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

interface WriteProps {
  isGenerating: boolean;
  aiDone: boolean;
  text: string;
  onChange: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  generatedImageUrl: string | null;
  storeName?: string;
}

export default function WriteStep({
  isGenerating,
  aiDone,
  text,
  onChange,
  onNext,
  onBack,
  onClose,
  generatedImageUrl,
  storeName,
}: WriteProps) {
  const { width } = useWindowDimensions();

  // '작성 완료' 버튼 활성화 조건
  const canComplete = aiDone && text.trim().length > 30;

  const handleComplete = () => {
    if (canComplete) onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{storeName || "가게"}</Text>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <Ionicons name="close" size={width * 0.06} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 본문 + 하단 버튼을 세로로 배치 (absolute 사용 안 함) */}
      <View style={styles.body}>
        {/* 스크롤 본문 (하단 버튼 높이만큼 여유 paddingBottom) */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI 상태 */}
          <View style={styles.aiSection}>
            <Text style={styles.sectionTitle}>AI 포스터 생성</Text>

            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={require("../../../assets/AI-loading.json")}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                <Text style={styles.loadingText}>
                  AI 포스터를 생성중입니다...
                </Text>
                <Text style={styles.loadingSubText}>
                  약간의 시간이 소요됩니다
                </Text>
              </View>
            ) : null}

            {aiDone && generatedImageUrl ? (
              <View style={styles.aiCompleteContainer}>
                <Image
                  source={{ uri: generatedImageUrl }}
                  style={styles.generatedImage}
                  resizeMode="cover"
                />
                <Text style={styles.aiCompleteText}>
                  AI 포스터 생성이 완료되었습니다!
                </Text>
                <Text style={styles.aiCompleteSubText}>
                  아래에 이벤트 설명을 작성해주세요
                </Text>
              </View>
            ) : null}
          </View>

          {/* 설명 입력 */}
          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>이벤트 설명 작성</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="현재 진행하는 이벤트에 대해서 자유롭게 설명해주세요"
              placeholderTextColor="#999999"
              textAlignVertical="top"
              value={text}
              onChangeText={onChange}
              maxLength={500}
              scrollEnabled
            />
            <View style={styles.textCounter}>
              <Text style={styles.counterText}>{text.length}/500</Text>
            </View>
          </View>
        </ScrollView>

        {/* 하단 고정 버튼 (absolute 아님) */}
        <View style={styles.footer}>
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
                ? "AI 포스터 생성 중..."
                : text.trim().length <= 30
                ? "설명을 30자 이상 작성해주세요"
                : "작성 완료"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // 본문 + 하단 버튼을 세로로(footer가 항상 아래에 오도록)
  body: { flex: 1 },
  content: { flex: 1, backgroundColor: "#F7F8F9" },

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
    marginBottom: 20,
  },
  loadingContainer: { alignItems: "center", paddingVertical: 20 },
  lottie: { width: 150, height: 150, marginBottom: 16 },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  loadingSubText: { fontSize: 14, color: "#666666" },
  aiCompleteContainer: { alignItems: "center", paddingVertical: 20 },
  generatedImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: "#F0F0F0",
  },
  aiCompleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  aiCompleteSubText: { fontSize: 14, color: "#666666", textAlign: "center" },

  textSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  textInput: {
    minHeight: 150,
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
  textCounter: { alignItems: "flex-end", marginTop: 8 },
  counterText: { fontSize: 12, color: "#999999" },

  // 하단 버튼 영역(absolute 제거)
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  completeButton: {
    backgroundColor: "#fec566",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#fec566",
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
  completeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
