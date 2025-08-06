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
}: GenProps) {
  const { width } = useWindowDimensions();
  const [localImages, setLocalImages] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  useEffect(() => {
    const newImages: (string | null)[] = [null, null, null];
    uploadedImages.forEach((img, index) => {
      if (index < 3) {
        newImages[index] = img;
      }
    });
    setLocalImages(newImages);
  }, [uploadedImages]);

  const handleAddImage = (index: number, imageUrl: string) => {
    const newImages = [...localImages];
    newImages[index] = imageUrl;
    setLocalImages(newImages);
    if (onAdd) onAdd(imageUrl);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...localImages];
    newImages[index] = null;
    setLocalImages(newImages);
    if (onRemove) onRemove(index);
  };

  const hasImages = localImages.some((img) => img !== null);
  const isDisabled = !contentType || !hasImages || !prompt.trim();

  const placeholderText = `1. 한글 텍스트가 깨질 수 있어요
일부 AI 모델은 한글을 완벽하게 인식하지 못해 텍스트가 이미지에 올바르게 출력되지 않을 수 있습니다.

2. 구체적으로 작성할수록 좋아요
원하는 이미지가 있다면, 색상, 분위기, 배치, 텍스트 위치 등을 최대한 자세히 설명해 주세요.
예) "20대 남성이 집에서 음식을 맛있게 먹고 활짝 웃으면서 행복해하는 모습을 친구가 찍어준 구도(음식과 남성이 다 보이는)로 이미지를 생성해줘"

3. 한 번 더 고민해주세요.
리뷰는 사용자의 경험을 기록하고, 도움이 될만한 정보를 공유하며 다른 이용자는 물론 사업자와도 소통 할 수 있는 공간입니다.

AI를 통한 리뷰를 생성 시 모두가 쾌적한 리뷰 문화를 경험할 수 있도록 배려해 주세요`;

  return (
    <>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color="#1A1A1A" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll}>
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
                  onPress={() => onType(t)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cb, contentType === t && styles.cbOn]}>
                    {contentType === t && <Text style={styles.ck}>✓</Text>}
                  </View>
                  <Text style={styles.lbl}>
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
          />
        </View>

        <View style={styles.promptSec}>
          <Text style={styles.sectionTitle}>
            생성할 리뷰의 내용을 구체적으로 작성해주세요
          </Text>
          <TextInput
            style={styles.promptInput}
            multiline
            placeholder={placeholderText}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={prompt}
            onChangeText={onPrompt}
            scrollEnabled={true}
            numberOfLines={10}
          />
        </View>
      </ScrollView>

      {/* 확인 버튼 */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={isDisabled ? () => {} : onNext}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
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
});
