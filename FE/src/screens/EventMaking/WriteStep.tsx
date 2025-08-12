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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

// 이 컴포넌트가 부모(EventMakingScreen)로부터 받아야 할 재료들
interface WriteProps {
  isGenerating: boolean; // AI가 이미지를 생성 중인지 여부
  aiDone: boolean; // AI 이미지 생성이 완료되었는지 여부
  text: string; // 사용자가 입력한 이벤트 설명글
  onChange: (t: string) => void; // 설명글이 바뀔 때마다 부모에게 알리는 함수
  onNext: () => void; // '작성 완료' 버튼을 눌렀을 때 부모에게 알리는 함수
  onBack: () => void; // '뒤로가기' 버튼을 눌렀을 때
  onClose: () => void; // '닫기' 버튼을 눌렀을 때
  generatedImageUrl: string | null; // AI가 생성한 이미지의 주소
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
}: WriteProps) {
  const { width } = useWindowDimensions();

  // '작성 완료' 버튼을 활성화할 조건
  // -> AI 생성이 끝났고, 설명글이 30자 이상일 때만 true
  const canComplete = aiDone && text.trim().length > 30;

  // 버튼을 눌렀을 때 실행될 함수
  const handleComplete = () => {
    // 활성화 조건이 충족되었을 때만 부모에게 'onNext' 신호를 보냄
    if (canComplete) {
      onNext();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 (뒤로가기, 제목, 닫기) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>햄찌네 피자</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={width * 0.06} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 메인 콘텐츠 영역 (스크롤 가능) */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI 포스터 생성 상태를 보여주는 섹션 */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI 포스터 생성</Text>

          {/* AI가 생성 중일 때 로딩 애니메이션 표시 */}
          {isGenerating && (
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
          )}

          {/* AI 생성이 완료되면 결과 이미지와 안내 문구 표시 */}
          {aiDone && generatedImageUrl && (
            <View style={styles.aiCompleteContainer}>
              <Image
                source={{ uri: generatedImageUrl }}
                style={styles.generatedImage}
              />
              <Text style={styles.aiCompleteText}>
                AI 포스터 생성이 완료되었습니다!
              </Text>
              <Text style={styles.aiCompleteSubText}>
                아래에 이벤트 설명을 작성해주세요
              </Text>
            </View>
          )}
        </View>

        {/* 이벤트 설명을 작성하는 섹션 */}
        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>이벤트 설명 작성</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={`현재 진행하는 이벤트에 대해서 자유롭게 설명해주세요`}
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

      {/* 화면 하단에 고정된 '작성 완료' 버튼 */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            !canComplete && styles.completeButtonDisabled, // 조건에 따라 비활성화 스타일 적용
          ]}
          onPress={handleComplete}
          disabled={!canComplete} // 조건에 따라 버튼 자체를 비활성화
          activeOpacity={canComplete ? 0.7 : 1}
        >
          <Text style={styles.completeButtonText}>
            {/* 상황에 맞는 버튼 텍스트 보여주기 */}
            {!aiDone
              ? "AI 포스터 생성 중..."
              : text.trim().length <= 30
              ? "설명을 30자 이상 작성해주세요"
              : "작성 완료"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- 스타일 정의 ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
  title: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
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
    marginBottom: 100,
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
