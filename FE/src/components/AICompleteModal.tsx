// src/components/AICompleteModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
} from "react-native";

interface AICompleteModalProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  reviewText?: string;
  contentType?: "image" | "video" | null;
  onConfirm?: () => void; // 게시하기 버튼
  onCancel?: () => void; // 취소 버튼
}

export default function AICompleteModal({
  visible,
  onClose,
  generatedContent,
  onConfirm,
  onCancel,
}: AICompleteModalProps) {
  const { width, height } = useWindowDimensions();
  const modalWidth = width * 0.9;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // 더미 햄스터 이미지 URL
  const hamsterImageUrl =
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { width: modalWidth }]}>
          {/* AI 생성 이미지 */}
          <View style={styles.imageSection}>
            <Image
              source={{ uri: generatedContent || hamsterImageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
          </View>

          {/* 텍스트 콘텐츠 */}
          <View style={styles.textContent}>
            <Text style={styles.title}>리뷰 생성 완료!</Text>
            <Text style={styles.subtitle}>
              생성된 리뷰를 리뷰 게시판에 게시하시겠습니까?
            </Text>
          </View>

          {/* 버튼들 */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>게시하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  } as ViewStyle,

  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxWidth: 400,
  } as ViewStyle,

  // 이미지 섹션
  imageSection: {
    width: "100%",
    height: 250,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  } as ViewStyle,

  generatedImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,

  // 텍스트 콘텐츠
  textContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "center",
  } as ViewStyle,

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  } as TextStyle,

  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  } as TextStyle,

  // 버튼 섹션
  buttonSection: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  } as ViewStyle,

  confirmButton: {
    backgroundColor: "#FF69B4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  } as ViewStyle,

  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  } as TextStyle,

  cancelButton: {
    backgroundColor: "#9CA3AF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  } as ViewStyle,

  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  } as TextStyle,
});
