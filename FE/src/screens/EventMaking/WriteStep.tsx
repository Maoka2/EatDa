// src/screens/EventMaking/WriteStep.tsx
import React, { useEffect, useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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

  // ✅ 키보드 높이 감지해서 하단 버튼과 스크롤 여백을 올림
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const canComplete = aiDone && text.trim().length > 30;

  const handleComplete = () => {
    if (canComplete) {
      onNext();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={0}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={width * 0.06}
              color="#333"
            ></Ionicons>
          </TouchableOpacity>
          <Text style={styles.title}>{storeName ? storeName : "가게"}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={width * 0.06} color="#333"></Ionicons>
          </TouchableOpacity>
        </View>

        {/* 본문 */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={"handled"}
          contentContainerStyle={{
            paddingBottom: 120 + keyboardHeight, // ✅ 키보드 높이만큼 여백 추가
          }}
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
                ></LottieView>
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
                  resizeMode={"cover"}
                ></Image>
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
              placeholder={
                "현재 진행하는 이벤트에 대해서 자유롭게 설명해주세요"
              }
              placeholderTextColor={"#999999"}
              textAlignVertical={"top"}
              value={text}
              onChangeText={onChange}
              maxLength={500}
              scrollEnabled={true}
            ></TextInput>
            <View style={styles.textCounter}>
              <Text style={styles.counterText}>{text.length}/500</Text>
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 - 키보드 뜨면 같이 올라감 */}
        <View style={[styles.bottom, { bottom: keyboardHeight }]}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              !canComplete ? styles.completeButtonDisabled : null,
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
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
