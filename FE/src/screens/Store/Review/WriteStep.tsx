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
  Modal,
} from "react-native";
import LottieView from "lottie-react-native";

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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [generatedText, setGeneratedText] = useState("");

  // aiDone이 true가 되면 모달 표시
  useEffect(() => {
    if (aiDone && !showCompletionModal) {
      // 더미 리뷰 텍스트 생성
      const dummyReview = `햄찌네 피자에서 정말 맛있는 피자를 먹었어요! 🍕

치즈가 정말 진하고 도우도 바삭바삭해서 너무 좋았습니다. 특히 페퍼로니 피자는 정말 최고였어요. 토핑도 신선하고 양도 충분했습니다.

분위기도 아늑하고 직원분들도 정말 친절하셨어요. 가격대비 양과 맛 모두 만족스러웠습니다.

다음에도 또 오고 싶은 곳이에요! 강력 추천합니다 👍`;

      setGeneratedText(dummyReview);
      onChange(dummyReview);
      setShowCompletionModal(true);
    }
  }, [aiDone]);

  const handleModalConfirm = () => {
    setShowCompletionModal(false);
  };

  const handleModalCancel = () => {
    setShowCompletionModal(false);
    onBack(); // 이전 단계로 돌아가기
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.navButton}>
          <Text style={styles.nav}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>햄찌네 피자</Text>
        <TouchableOpacity onPress={onClose} style={styles.navButton}>
          <Text style={styles.nav}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isGenerating && (
          <View style={styles.status}>
            <View style={styles.loadingContainer}>
              <LottieView
                source={require("../../../../assets/AI-loading.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={styles.statusText}>AI가 리뷰를 생성중입니다...</Text>
              <Text style={styles.statusSubText}>잠시만 기다려주세요</Text>
            </View>
          </View>
        )}

        {aiDone && (
          <View style={styles.inputWrap}>
            <Text style={styles.label}>텍스트 리뷰를 작성해주세요</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="리뷰 내용이 여기에 표시됩니다..."
              placeholderTextColor="#999999"
              textAlignVertical="top"
              value={text}
              onChangeText={onChange}
            />
          </View>
        )}
      </ScrollView>

      {aiDone && (
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.btn, !text.trim() && styles.btnOff]}
            onPress={onNext}
            disabled={!text.trim()}
          >
            <Text style={styles.btnText}>완료</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 리뷰 생성 완료 모달 */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoTitle}>어딘가 많이 이상한</Text>
              <Text style={styles.videoSubtitle}>햄스터 요리사.mp4</Text>
              <View style={styles.videoContent}>
                {/* 햄스터 이미지 영역 */}
                <View style={styles.hamsterContainer}>
                  <Text style={styles.hamsterEmoji}>🐹</Text>
                </View>
                {/* 비디오 컨트롤 */}
                <View style={styles.videoControls}>
                  <Text style={styles.videoTime}>0:0</Text>
                  <View style={styles.progressBar}>
                    <View style={styles.progressIndicator} />
                  </View>
                  <Text style={styles.videoTime}>0:0</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>리뷰 생성 완료!</Text>
              <Text style={styles.modalSubtitle}>
                생성된 리뷰를 리뷰 게시판에 게시하시겠습니까?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleModalConfirm}
                >
                  <Text style={styles.confirmButtonText}>게시하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleModalCancel}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    fontSize: 24,
    color: "#1A1A1A",
    fontWeight: "400",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  status: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "600",
    textAlign: "center",
  },
  statusSubText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },

  inputWrap: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 100,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  input: {
    minHeight: 200,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FAFAFA",
    color: "#1A1A1A",
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
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
  btn: {
    backgroundColor: "#FF69B4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnOff: {
    backgroundColor: "#D1D5DB",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
  },
  videoPlaceholder: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  videoTitle: {
    color: "#FFFF00",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  videoSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  videoContent: {
    alignItems: "center",
  },
  hamsterContainer: {
    width: 200,
    height: 150,
    backgroundColor: "#F5E6D3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  hamsterEmoji: {
    fontSize: 60,
  },
  videoControls: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  videoTime: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#333333",
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressIndicator: {
    width: "30%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    width: "100%",
    gap: 12,
  },
  confirmButton: {
    backgroundColor: "#FF69B4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#9CA3AF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
