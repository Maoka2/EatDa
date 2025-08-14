// src/screens/Store/Menu/GenerateStep.tsx  ← 당신 경로에 맞게 유지

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
import { useNavigation, useRoute } from "@react-navigation/native";
import { normalizeImageForUpload } from "../../../utils/normalizeImage";
interface GenPropsFromRoute {
  storeId: number;
  selectedMenuIds: number[];
}

export default function GenerateStep() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, selectedMenuIds } = (route?.params ||
    {}) as GenPropsFromRoute;

  const { width } = useWindowDimensions();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [localImages, setLocalImages] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const newImages: (string | null)[] = [null, null, null];
    uploadedImages.forEach((img, index) => {
      if (index < 3) newImages[index] = img;
    });
    setLocalImages(newImages);
  }, [uploadedImages]);

  const handleAddImage = (index: number, imageUrl: string) => {
    const newImages = [...localImages];
    newImages[index] = imageUrl;
    setLocalImages(newImages);
    setUploadedImages((prev) => {
      const copy = [...prev];
      // index 자리에 맞춰 유지하고 싶으면 다음 로직으로 대체 가능
      // while (copy.length <= index) copy.push("");
      // copy[index] = imageUrl;
      // return copy.filter(Boolean);
      return [...copy, imageUrl];
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...localImages];
    newImages[index] = null;
    setLocalImages(newImages);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const hasImages = localImages.some((img) => img !== null);
  const isDisabled = !hasImages || !prompt.trim();

  const handleConfirm = async () => {
    if (
      !storeId ||
      !Array.isArray(selectedMenuIds) ||
      selectedMenuIds.length === 0
    ) {
      Alert.alert("오류", "가게/메뉴 선택 정보가 없습니다.");
      return;
    }
    if (isDisabled) return;

    try {
      setLoading(true);

      const files = await Promise.all(
        localImages
          .map((uri, idx) => (uri ? { uri, idx } : null))
          .filter(Boolean)
          .map(async ({ uri, idx }: any) =>
            normalizeImageForUpload({ uri, name: `image_${idx}.jpg` }, idx)
          )
      );

      const formData = new FormData();
      formData.append("storeId", String(storeId));
      selectedMenuIds.forEach((id) => formData.append("menuIds", String(id)));
      formData.append("prompt", prompt);
      formData.append("type", "IMAGE");
      localImages.forEach((uri, idx) => {
        if (uri) {
          formData.append("image", {
            uri,
            name: `image_${idx}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      });
      if (!files.length) {
        Alert.alert("오류", "최소 1장의 이미지를 첨부해주세요.");
        return;
      }

      const res = await requestMenuPosterAsset(formData);
      const menuPosterId: number | undefined =
        (res && (res as any).menuPosterId) ||
        (res &&
          (res as any).raw &&
          (res as any).raw.data &&
          (res as any).raw.data.menuPosterId) ||
        (res && (res as any).raw && (res as any).raw.menuPosterId);

      if (!menuPosterId) {
        console.warn("[GenerateStep] menuPosterId not found in response:", res);
        Alert.alert(
          "오류",
          "생성 요청은 성공했지만 포스터 ID를 찾지 못했습니다."
        );
        return;
      }

      // ✅ 바로 WriteStep으로 이동하면서 menuPosterId 전달
      navigation.navigate("MenuPosterWriteStep", { menuPosterId });
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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
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
            onChangeText={setPrompt}
            scrollEnabled={true}
            numberOfLines={10}
          />
        </View>
      </ScrollView>

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
  backButton: { position: "absolute", top: 40, left: 16, zIndex: 10 },
  scroll: { flex: 1, backgroundColor: "#F7F8F9" },
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
  subtitle: { fontSize: 14, color: "#666666", textAlign: "center" },
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
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
