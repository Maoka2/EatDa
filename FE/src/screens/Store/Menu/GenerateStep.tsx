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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageUploader from "../../../components/ImageUploader";
import { requestMenuPosterAsset } from "./services/api";

interface GenProps {
  uploadedImages: string[];
  prompt: string;
  onAdd: (imageUrl: string) => void;
  onRemove: (i: number) => void;
  onPrompt: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
  storeId: number;
  selectedMenuIds: number[];
}

export default function GenerateStep({
  uploadedImages,
  prompt,
  onAdd,
  onRemove,
  onPrompt,
  onNext,
  onBack,
  storeId,
  selectedMenuIds,
}: GenProps) {
  const { width } = useWindowDimensions();
  const [localImages, setLocalImages] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);

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
    onAdd(imageUrl);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...localImages];
    newImages[index] = null;
    setLocalImages(newImages);
    onRemove(index);
  };

  const hasImages = localImages.some((img) => img !== null);
  const isDisabled = !hasImages || !prompt.trim();

  const handleConfirm = async () => {
    if (isDisabled) return;

    try {
      setLoading(true);

      // FormData 구성
      const formData = new FormData();
      formData.append("storeId", String(storeId));
      selectedMenuIds.forEach((id) => formData.append("menuIds", String(id)));
      formData.append("prompt", prompt);

      localImages.forEach((uri, idx) => {
        if (uri) {
          formData.append("images", {
            uri,
            name: `image_${idx}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      });

      const res = await requestMenuPosterAsset(formData);
      console.log("[GenerateStep] Asset Request Response:", res);

      Alert.alert("성공", "메뉴판 생성 요청이 완료되었습니다.");
      onNext();
    } catch (err: any) {
      console.error("[GenerateStep] Asset Request Error:", err);
      Alert.alert(
        "오류",
        err.message || "메뉴판 생성 요청 중 문제가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const placeholderText = `1. 한글 텍스트가 깨질 수 있어요
일부 AI 모델은 한글을 완벽하게 인식하지 못해 텍스트가 이미지에 올바르게 출력되지 않을 수 있습니다.

2. 구체적으로 작성할수록 좋아요
원하는 이미지가 있다면, 색상, 분위기, 배치, 텍스트 위치 등을 최대한 자세히 설명해 주세요.
예) "20대 남성이 집에서 음식을 맛있게 먹고 활짝 웃으면서 행복해하는 모습을 친구가 찍어준 구도(음식과 남성이 다 보이는)로 이미지를 생성해줘"

3. Best 메뉴판에 도전해봐요
Best 5 메뉴판에 선정되면 특별한 혜택이 주어집니다-!

모두가 쾌적한 메뉴판 생성 문화를 경험할 수 있도록 배려해 주세요`;

  return (
    <>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color="#1A1A1A" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>메뉴판 생성</Text>
          <Text style={styles.subtitle}>
            생성할 메뉴판의 데이터를 입력해주세요
          </Text>
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
            생성할 메뉴판의 내용을 구체적으로 작성해주세요
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
          onPress={handleConfirm}
          disabled={isDisabled || loading}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text style={styles.buttonText}>
            {loading ? "요청 중..." : "확인"}
          </Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
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
