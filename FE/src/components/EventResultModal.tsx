// src/components/EventResultModal.tsx
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

interface EventResultModalProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  // 텍스트 커스터마이징
  title?: string;
  subtitle?: string;
  // 버튼 텍스트 커스터마이징
  retryButtonText?: string;
  downloadButtonText?: string;
  uploadButtonText?: string;
  // 버튼 핸들러들
  onRetry?: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
  // 대체 핸들러들 (CompleteModal 호환성)
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function EventResultModal({
  visible,
  onClose,
  generatedContent,
  title = "이벤트 포스터 생성 완료!",
  subtitle = "이벤트 게시판에 업로드 가능합니다",
  retryButtonText = "다시 만들기",
  downloadButtonText = "파일로 저장",
  uploadButtonText = "이벤트 게시판에 업로드",
  onRetry,
  onDownload,
  onUpload,
  onConfirm,
  onCancel,
}: EventResultModalProps) {
  const { width } = useWindowDimensions();
  const modalWidth = width * 0.9;

  // 더미 이미지 URL (기본값)
  const defaultImageUrl =
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop";

  // 핸들러 우선순위: onRetry > onCancel, onUpload > onConfirm
  const handleRetry = onRetry || onCancel || (() => {});
  const handleDownload = onDownload || (() => {});
  const handleUpload = onUpload || onConfirm || (() => {});

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
              source={{ uri: generatedContent || defaultImageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
          </View>

          {/* 텍스트 콘텐츠 */}
          <View style={styles.textContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* 상단 버튼들 */}
          <View style={styles.topButtonSection}>
            <TouchableOpacity
              style={[styles.topButton, styles.retryButton]}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.topButtonText}>{retryButtonText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topButton, styles.downloadButton]}
              onPress={handleDownload}
              activeOpacity={0.7}
            >
              <Text style={styles.topButtonText}>{downloadButtonText}</Text>
            </TouchableOpacity>
          </View>

          {/* 하단 메인 버튼 */}
          <View style={styles.bottomButtonSection}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadButtonText}>{uploadButtonText}</Text>
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

  // 상단 버튼 섹션
  topButtonSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  } as ViewStyle,

  topButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  } as ViewStyle,

  retryButton: {
    backgroundColor: "#9CA3AF",
  } as ViewStyle,

  downloadButton: {
    backgroundColor: "#9CA3AF",
  } as ViewStyle,

  topButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  } as TextStyle,

  // 하단 메인 버튼 섹션
  bottomButtonSection: {
    padding: 24,
    paddingTop: 12,
  } as ViewStyle,

  uploadButton: {
    backgroundColor: "#fec566",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  } as TextStyle,
});
