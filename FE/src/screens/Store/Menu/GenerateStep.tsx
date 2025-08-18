// src/screens/Store/Menu/GenerateStep.tsx
import React, { useState, useEffect, useMemo } from "react";
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
import { requestMenuPosterAsset } from "./services/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { normalizeImageForUpload } from "../../../utils/normalizeImage";
import ResultModal from "../../../components/ResultModal";

interface GenPropsFromRoute {
  storeId: number;
  selectedMenuIds: number[];
  storeName: string;
}

type ResultState = {
  visible: boolean;
  type: "success" | "failure";
  title?: string;
  message: string;
  onClose?: () => void;
};

export default function GenerateStep() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { storeId, selectedMenuIds, storeName } = (route?.params ||
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

  // 키보드 열림 감지 (Android)
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

  // ResultModal 상태
  const [result, setResult] = useState<ResultState>({
    visible: false,
    type: "failure",
    title: undefined,
    message: "",
  });

  const showFailure = (message: string, title?: string) => {
    setResult({
      visible: true,
      type: "failure",
      title,
      message,
      onClose: () => setResult((p) => ({ ...p, visible: false })),
    });
  };

  const showSuccess = (
    message: string,
    title?: string,
    onClose?: () => void
  ) => {
    setResult({
      visible: true,
      type: "success",
      title,
      message,
      onClose:
        onClose ??
        (() => {
          setResult((p) => ({ ...p, visible: false }));
        }),
    });
  };

  useEffect(() => {
    const next: (string | null)[] = [null, null, null];
    uploadedImages.forEach((img, i) => {
      if (i < 3) next[i] = img;
    });
    setLocalImages(next);
  }, [uploadedImages]);

  const handleAddImage = (index: number, imageUrl: string) => {
    if (loading) return;
    const next = [...localImages];
    next[index] = imageUrl;
    setLocalImages(next);
    setUploadedImages((prev) => [...prev, imageUrl]);
  };

  const handleRemoveImage = (index: number) => {
    if (loading) return;
    const next = [...localImages];
    next[index] = null;
    setLocalImages(next);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const hasImages = useMemo(
    () => localImages.some((img) => img !== null),
    [localImages]
  );
  const isDisabled = !hasImages || !prompt.trim() || loading;

  const handleConfirm = async () => {
    if (
      !storeId ||
      !Array.isArray(selectedMenuIds) ||
      selectedMenuIds.length === 0
    ) {
      showFailure("가게/메뉴 선택 정보가 없습니다.", "요청 실패");
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

      if (!files.length) {
        showFailure("최소 1장의 이미지를 첨부해주세요.", "요청 실패");
        return;
      }

      const formData = new FormData();
      formData.append("storeId", String(storeId));
      formData.append("type", "IMAGE");
      selectedMenuIds.forEach((id) => formData.append("menuIds", String(id)));
      formData.append("prompt", prompt);
      files.forEach((f: any, i: number) => {
        formData.append("image", {
          uri: f.uri,
          name: f.name ?? `image_${i}.jpg`,
          type: f.type ?? "image/jpeg",
        } as any);
      });

      console.log("[GenerateStep] REQUEST", {
        storeId,
        selectedMenuIds,
        promptLen: prompt.length,
        imagesCount: files.length,
      });

      const res: any = await requestMenuPosterAsset(formData, {
        filesForLog: files,
      });
      console.log("[GenerateStep] FULL RESPONSE", JSON.stringify(res, null, 2));

      const assetId: number | undefined =
        res?.menuPosterAssetId ??
        res?.assetId ??
        res?.raw?.data?.menuPosterAssetId ??
        res?.raw?.data?.assetId ??
        res?.raw?.data?.menuPosterId;

      if (typeof assetId !== "number") {
        showFailure("assetId를 찾지 못했습니다.", "응답 파싱 실패");
        return;
      }

      const posterId: number | undefined =
        res?.menuPosterId ??
        res?.raw?.data?.realMenuPosterId ??
        res?.raw?.data?.menuPosterIdReal;

      showSuccess("메뉴판 생성 요청이 접수되었습니다.", "요청 완료", () => {
        setResult((p) => ({ ...p, visible: false }));
        navigation.navigate("MenuPosterWriteStep", {
          assetId,
          menuPosterId: posterId,
          storeName,
          storeId,
        });
      });
    } catch (err: any) {
      console.error("[GenerateStep] Asset Request Error:", err);
      const msg = err?.message || "메뉴판 생성 요청 중 문제가 발생했습니다.";
      showFailure(msg, "요청 실패");
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Platform.OS === "android"}
      behavior="height"
    >
      {/* 뒤로가기 */}
      <TouchableOpacity
        onPress={loading ? undefined : () => navigation.goBack()}
        style={[styles.backButton, loading && styles.backButtonDisabled]}
        disabled={loading}
      >
        <Ionicons
          name="chevron-back"
          size={width * 0.06}
          color={loading ? "#999" : "#1A1A1A"}
        />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: keyboardOpen ? 24 : 140, // 키보드 열리면 여백 축소
        }}
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
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
            disabled={loading}
          />
        </View>

        <View style={styles.promptSec}>
          <Text style={styles.sectionTitle}>
            생성할 메뉴판의 내용을 구체적으로 작성해주세요
          </Text>
          <TextInput
            style={[styles.promptInput, loading && styles.promptInputDisabled]}
            multiline
            placeholder={placeholderText}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={prompt}
            onChangeText={loading ? undefined : setPrompt}
            scrollEnabled
            numberOfLines={10}
            editable={!loading}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      </ScrollView>

      {/* 하단 버튼: 키보드 열리면 absolute 해제 */}
      <View
        style={[
          styles.bottom,
          keyboardOpen ? { position: "relative", paddingBottom: 16 } : null,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            (isDisabled || loading) && styles.buttonDisabled,
          ]}
          onPress={isDisabled ? () => {} : handleConfirm}
          disabled={isDisabled || loading}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          {loading ? (
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

      {/* 결과 모달 */}
      <ResultModal
        visible={result.visible}
        type={result.type}
        title={result.title}
        message={result.message}
        onClose={
          result.onClose || (() => setResult((p) => ({ ...p, visible: false })))
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: { position: "absolute", top: 40, left: 16, zIndex: 10 },
  backButtonDisabled: { opacity: 0.5 },
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
  promptInputDisabled: { backgroundColor: "#F5F5F5", color: "#999" },
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
  loadingButtonContent: { flexDirection: "row", alignItems: "center" },
});
