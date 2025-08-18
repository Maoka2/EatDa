// src/components/AICompleteModal.tsx
import React, { useState, useEffect } from "react";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

interface AICompleteModalProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  contentType?: "IMAGE" | "SHORTS_RAY_2" | "SHORTS_GEN_4" | null;
  title: string;
  subtitle: string;
  confirmButtonText: string;
  cancelButtonText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AICompleteModal({
  visible,
  onClose,
  generatedContent,
  contentType,
  title,
  subtitle,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  onCancel,
}: AICompleteModalProps) {
  const { width } = useWindowDimensions();
  const modalWidth = width * 0.9;

  // 비디오 관련 상태
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 더미 이미지 URL (기본값)
  const defaultImageUrl =
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop";

  // 콘텐츠 타입 판별
  const isVideo =
    contentType === "SHORTS_RAY_2" || contentType === "SHORTS_GEN_4";
  const isImage = contentType === "IMAGE" || !contentType;

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (visible) {
      setIsVideoLoading(isVideo); // 비디오면 로딩 시작
      setVideoError(false);
      setIsPlaying(false);

      console.log("[AICompleteModal] 모달 열림:", {
        contentType,
        isVideo,
        generatedContent: generatedContent ? "있음" : "없음",
      });
    }
  }, [visible, isVideo, generatedContent]);

  // 비디오 로드 성공 핸들러
  const handleVideoLoad = (status: any) => {
    console.log("[AICompleteModal] 비디오 로드 완료");
    setIsVideoLoading(false);
    setVideoError(false);
    setIsPlaying(true); // 자동 재생 시작
  };

  // 비디오 로드 실패 핸들러
  const handleVideoError = (error: any) => {
    console.error("[AICompleteModal] 비디오 로드 실패:", error);
    setIsVideoLoading(false);
    setVideoError(true);
    Alert.alert(
      "알림",
      "영상을 재생할 수 없습니다. 이미지로 대체하여 표시합니다."
    );
  };

  // 비디오 상태 변경 핸들러
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);

      // 비디오가 끝까지 재생되면 다시 처음부터 재생 (루프)
      if (status.didJustFinish) {
        console.log("[AICompleteModal] 비디오 재생 완료, 다시 시작");
      }
    }
  };

  // 비디오 재생/일시정지 토글
  const toggleVideoPlayback = () => {
    console.log("[AICompleteModal] 비디오 재생 상태 토글");
    setIsPlaying(!isPlaying);
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    // 콘텐츠가 없는 경우 기본 이미지
    if (!generatedContent) {
      console.log("[AICompleteModal] 생성된 콘텐츠 없음, 기본 이미지 사용");
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: defaultImageUrl }}
            style={styles.generatedImage}
            resizeMode="cover"
          />
          <View style={styles.noContentLabel}>
            <Text style={styles.noContentText}>생성된 콘텐츠가 없습니다</Text>
          </View>
        </View>
      );
    }

    // 영상인 경우
    if (isVideo && !videoError) {
      console.log("[AICompleteModal] 비디오 렌더링:", generatedContent);
      return (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: generatedContent }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true} // 자동 재생
            isLooping={true} // 반복 재생
            isMuted={false} // 음소거 해제
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* 로딩 인디케이터 */}
          {isVideoLoading && (
            <View style={styles.videoLoadingOverlay}>
              <ActivityIndicator size="large" color="#FF69B4" />
              <Text style={styles.loadingText}>영상 로딩 중...</Text>
            </View>
          )}

          {/* 재생 컨트롤 오버레이 */}
          <TouchableOpacity
            style={styles.playControlOverlay}
            onPress={toggleVideoPlayback}
            activeOpacity={0.7}
          >
            {!isPlaying && !isVideoLoading && (
              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>▶</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 콘텐츠 타입 표시 */}
          <View style={styles.contentTypeLabel}>
            <Text style={styles.contentTypeLabelText}>
              {contentType === "SHORTS_RAY_2" ? "예쁜 쇼츠" : "빠른 쇼츠"}
            </Text>
          </View>
        </View>
      );
    }

    // 이미지인 경우 또는 비디오 에러 시
    console.log("[AICompleteModal] 이미지 렌더링:", generatedContent);
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: generatedContent }}
          style={styles.generatedImage}
          resizeMode="cover"
          onError={(error) => {
            console.warn("[AICompleteModal] 이미지 로드 실패:", error);
          }}
        />

        {/* 이미지 타입 표시 */}
        {contentType === "IMAGE" && (
          <View style={styles.contentTypeLabel}>
            <Text style={styles.contentTypeLabelText}>AI 이미지</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { width: modalWidth }]}>
          {/* AI 생성 콘텐츠 */}
          <View style={styles.contentSection}>{renderContent()}</View>

          {/* 텍스트 콘텐츠 */}
          <View style={styles.textContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* 버튼들 - ⭐ 버튼이 둘 다 없으면 버튼 섹션 자체를 숨김 */}
          {(confirmButtonText ||
            (cancelButtonText && cancelButtonText.trim() !== "")) && (
            <View style={styles.buttonSection}>
              {confirmButtonText && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmButtonText}>
                    {confirmButtonText}
                  </Text>
                </TouchableOpacity>
              )}

              {/* ⭐ cancelButtonText가 있을 때만 취소 버튼 표시 */}
              {cancelButtonText && cancelButtonText.trim() !== "" && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>
                    {cancelButtonText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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

  // 콘텐츠 섹션
  contentSection: {
    width: "100%",
    height: 280, // 비디오 컨트롤을 위해 높이 증가
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  } as ViewStyle,

  // 이미지 컨테이너
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  } as ViewStyle,

  generatedImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,

  // 비디오 컨테이너
  videoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "#000000",
  } as ViewStyle,

  video: {
    width: "100%",
    height: "100%",
  } as ViewStyle,

  // 비디오 로딩 오버레이
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 8,
  } as TextStyle,

  // 재생 컨트롤 오버레이
  playControlOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  } as ViewStyle,

  playButtonText: {
    fontSize: 24,
    color: "#FF69B4",
    fontWeight: "bold",
    marginLeft: 4, // 재생 버튼 아이콘 중앙 정렬
  } as TextStyle,

  // 콘텐츠 타입 라벨
  contentTypeLabel: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 105, 180, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  } as ViewStyle,

  contentTypeLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  } as TextStyle,

  // 콘텐츠 없음 라벨
  noContentLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -10 }],
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  } as ViewStyle,

  noContentText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  } as TextStyle,

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
    marginBottom: 8,
  } as TextStyle,

  videoInfo: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
    fontStyle: "italic",
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
