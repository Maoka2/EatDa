// src/components/AICompleteModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";

interface AICompleteModalProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null; // null도 허용하도록 수정
  reviewText?: string;
  contentType?: "image" | "video" | null; // null도 허용하도록 수정
}

export default function AICompleteModal({
  visible,
  onClose,
  generatedContent,
  reviewText,
  contentType = "image",
}: AICompleteModalProps) {
  const { width, height } = useWindowDimensions();
  const modalWidth = width * 0.9;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            { width: modalWidth, maxHeight: height * 0.8 },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 생성된 콘텐츠 */}
            {generatedContent && (
              <View style={styles.contentSection}>
                <Text style={styles.sectionTitle}>
                  {contentType === "image" ? "생성된 이미지" : "생성된 영상"}
                </Text>
                <View style={styles.contentWrapper}>
                  <Image
                    source={{ uri: generatedContent }}
                    style={[
                      styles.generatedContent,
                      { width: modalWidth * 0.8 },
                    ]}
                    resizeMode="contain"
                  />
                  {contentType === "video" && (
                    <View style={styles.playIcon}>
                      <Text style={styles.playIconText}>▶</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 텍스트 리뷰 */}
            {reviewText && (
              <View style={styles.reviewSection}>
                <Text style={styles.sectionTitle}>작성한 리뷰</Text>
                <View style={styles.reviewTextWrapper}>
                  <Text style={styles.reviewText}>{reviewText}</Text>
                </View>
              </View>
            )}

            {/* 완료 메시지 */}
            <View style={styles.completeMessage}>
              <Text style={styles.completeTitle}>🎉 리뷰 생성 완료!</Text>
              <Text style={styles.completeDesc}>
                생성된 리뷰가 업로드되었습니다.
              </Text>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
  } as ViewStyle,
  contentSection: {
    marginBottom: 20,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  } as TextStyle,
  contentWrapper: {
    position: "relative",
    alignItems: "center",
  } as ViewStyle,
  generatedContent: {
    height: 200,
    borderRadius: 12,
  } as ImageStyle,
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  playIconText: {
    color: "white",
    fontSize: 16,
    marginLeft: 2,
  } as TextStyle,
  reviewSection: {
    marginBottom: 20,
  } as ViewStyle,
  reviewTextWrapper: {
    backgroundColor: "#F7F8F9",
    borderRadius: 8,
    padding: 15,
  } as ViewStyle,
  reviewText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  } as TextStyle,
  completeMessage: {
    alignItems: "center",
    marginBottom: 20,
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
  closeButton: {
    backgroundColor: "#FF69B4",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  } as ViewStyle,
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
});
