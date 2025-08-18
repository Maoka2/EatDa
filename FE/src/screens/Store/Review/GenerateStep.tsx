// 3. GenerateStep.tsx
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageUploader from "../../../components/ImageUploader";

type ContentType = "image" | "shorts_ray2" | "shorts_gen4" | null;

interface GenProps {
  contentType: ContentType;
  uploadedImages: string[];
  prompt: string;
  onType: (t: ContentType) => void;
  onAdd: (imageUrl: string) => void;
  onRemove: (i: number) => void;
  onPrompt: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const contentTypeLabels = {
  image: "이미지",
  shorts_ray2: "예쁜 쇼츠",
  shorts_gen4: "빠른 쇼츠",
};

export default function GenerateStep({
  contentType,
  uploadedImages,
  prompt,
  onType,
  onAdd,
  onRemove,
  onPrompt,
  onNext,
  onBack,
  isLoading = false,
}: GenProps) {
  const { width } = useWindowDimensions();
  const [localImages, setLocalImages] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  // === Android 키보드 대응 (iOS 미사용) ===
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const next: (string | null)[] = [null, null, null];
    uploadedImages.forEach((img, i) => {
      if (i < 3) next[i] = img;
    });
    setLocalImages(next);
  }, [uploadedImages]);

  const handleAddImage = (index: number, imageUrl: string) => {
    if (isLoading) return;
    const next = [...localImages];
    next[index] = imageUrl;
    setLocalImages(next);
    onAdd(imageUrl);
  };

  const handleRemoveImage = (index: number) => {
    if (isLoading) return;
    const next = [...localImages];
    next[index] = null;
    setLocalImages(next);
    onRemove(index);
  };

  const hasImages = localImages.some((img) => img !== null);
  const isDisabled = !contentType || !hasImages || !prompt.trim() || isLoading;

  const placeholderText = `1. 한글 텍스트가 깨질 수 있어요
일부 AI 모델은 한글을 완벽하게 인식하지 못해 텍스트가 이미지에 올바르게 출력되지 않을 수 있습니다.

2. 구체적으로 작성할수록 좋아요
원하는 이미지가 있다면, 색상, 분위기, 배치, 텍스트 위치 등을 최대한 자세히 설명해 주세요.
예) "20대 남성이 집에서 음식을 맛있게 먹고 활짝 웃으면서 행복해하는 모습을 친구가 찍어준 구도(음식과 남성이 다 보이는)로 이미지를 생성해줘"

3. 한 번 더 고민해주세요.
리뷰는 사용자의 경험을 기록하고, 도움이 될만한 정보를 공유하며 다른 이용자는 물론 사업자와도 소통 할 수 있는 공간입니다.

AI를 통한 리뷰를 생성 시 모두가 쾌적한 리뷰 문화를 경험할 수 있도록 배려해 주세요`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      // Android만 적용 (iOS는 사용 X)
      enabled={Platform.OS === "android"}
      behavior="height"
    >
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity
        onPress={isLoading ? undefined : onBack}
        style={[styles.backButton, isLoading && styles.backButtonDisabled]}
        disabled={isLoading}
      >
        <Ionicons
          name="chevron-back"
          size={width * 0.06}
          color={isLoading ? "#999" : "#1A1A1A"}
        />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: keyboardOpen ? 24 : 140, // 키보드 열리면 여백 줄이고, 닫히면 하단 버튼 영역만큼 확보
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>리뷰 생성</Text>
          <Text style={styles.subtitle}>
            생성할 AI 리뷰의 데이터를 입력해주세요
          </Text>
        </View>

        <View style={styles.typeSec}>
          <Text style={styles.sectionTitle}>생성 유형</Text>
          <View style={styles.typeGrid}>
            {(["image", "shorts_ray2", "shorts_gen4"] as ContentType[]).map(
              (t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.cbWrap}
                  onPress={() => !isLoading && onType(t)}
                  activeOpacity={isLoading ? 1 : 0.7}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.cb,
                      contentType === t && styles.cbOn,
                      isLoading && styles.cbDisabled,
                    ]}
                  >
                    {contentType === t && <Text style={styles.ck}>✓</Text>}
                  </View>
                  <Text style={[styles.lbl, isLoading && styles.lblDisabled]}>
                    {contentTypeLabels[t as keyof typeof contentTypeLabels]}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={styles.upSec}>
          <Text style={styles.sectionTitle}>참고할 이미지를 첨부해주세요</Text>
          <ImageUploader
            images={localImages}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            maxImages={3}
            accentColor="#FF69B4"
            disabled={isLoading}
          />
        </View>

        <View style={styles.promptSec}>
          <Text style={styles.sectionTitle}>
            생성할 리뷰의 내용을 구체적으로 작성해주세요
          </Text>
          <TextInput
            style={[
              styles.promptInput,
              isLoading && styles.promptInputDisabled,
            ]}
            multiline
            placeholder={placeholderText}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={prompt}
            onChangeText={isLoading ? undefined : onPrompt}
            scrollEnabled
            numberOfLines={10}
            editable={!isLoading}
          />
        </View>
      </ScrollView>

      {/* 확인 버튼: 키보드가 열리면 absolute 해제해 가림 방지 */}
      <View
        style={[
          styles.bottom,
          keyboardOpen ? { position: "relative", paddingBottom: 16 } : null,
        ]}
      >
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={isDisabled ? () => {} : onNext}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          {isLoading ? (
            <View style={styles.loadingButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                요청 중...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>확인</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  backButtonDisabled: {
    opacity: 0.5,
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#F7F8F9",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  typeSec: {
    backgroundColor: "#F7F8F9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: "row",
    gap: 16,
  },
  cbWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  cb: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  cbOn: {
    backgroundColor: "#FF69B4",
    borderColor: "#FF69B4",
  },
  cbDisabled: {
    opacity: 0.5,
  },
  ck: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  lbl: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  lblDisabled: {
    color: "#999",
  },
  upSec: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#F7F8F9",
    marginBottom: 12,
  },
  promptSec: {
    backgroundColor: "#F7F8F9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 120,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    height: 250,
    padding: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
    fontSize: 12,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  promptInputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#F7F8F9",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
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
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
