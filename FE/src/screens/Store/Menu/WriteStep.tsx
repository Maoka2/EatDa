// src/screens/Store/Menu/WriteStep.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import {
  waitForAssetReady,
  finalizeMenuPoster,
  waitForAssetIdByMenuPoster,
} from "./services/api";
import CompleteModal from "./CompleteModal";
import ResultModal from "../../../components/ResultModal";

const LOADING_JSON = require("../../../../assets/AI-loading.json");

type RouteParams = {
  menuPosterId?: number; // 없으면 assetId를 대체키로 사용
  assetId?: number;
  storeName?: string;
  storeId?: number;
};

type ResultState = {
  visible: boolean;
  type: "success" | "failure";
  title?: string;
  message: string;
  onClose?: () => void;
};

export default function WriteStep() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    menuPosterId,
    assetId: assetIdFromRoute,
    storeName,
    storeId, // ✅ 가게 페이지로 이동용
  } = (route?.params || {}) as RouteParams;

  const { width } = useWindowDimensions();

  const [assetId, setAssetId] = useState<number | null>(
    assetIdFromRoute ?? null
  );
  const [isGenerating, setIsGenerating] = useState(true);
  const [aiDone, setAiDone] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ finalize 후 전송 모달 제어
  const [modalVisible, setModalVisible] = useState(false);
  const [finalizedPosterId, setFinalizedPosterId] = useState<number | null>(
    null
  );

  // ✅ ResultModal 상태 (Alert 대체)
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

  // ✅ KAV: Android에서 키보드 열림 감지 → 하단 버튼 가림 방지
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

  // 1) assetId 없으면 menuPosterId로 조회해서 확보
  useEffect(() => {
    let cancelled = false;

    async function ensureAssetId() {
      if (typeof assetId === "number") return;

      if (typeof menuPosterId !== "number") {
        setErrorMsg("assetId가 없고 menuPosterId도 없어 대기할 수 없습니다.");
        setIsGenerating(false);
        return;
      }

      setErrorMsg(null);
      setIsGenerating(true);
      try {
        const got = await waitForAssetIdByMenuPoster(menuPosterId, {
          intervalMs: 3000,
          maxWaitMs: 120000,
          onTick: (status, id) => {
            console.log("[WriteStep][ASSETID_POLL TICK]", { status, id });
          },
        });
        if (cancelled) return;
        setAssetId(got);
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(e?.message || "assetId를 가져오는 중 오류가 발생했습니다.");
        setIsGenerating(false);
      }
    }

    ensureAssetId();
    return () => {
      cancelled = true;
    };
  }, [menuPosterId, assetId]);

  // 2) assetId 준비되면 결과 폴링
  useEffect(() => {
    const id = assetId;
    if (id == null) return;

    let cancelled = false;

    async function pollResult(aid: number) {
      setIsGenerating(true);
      setAiDone(false);
      setGeneratedImageUrl(null);
      setErrorMsg(null);

      try {
        console.log("[WriteStep] START POLLING", {
          menuPosterId,
          assetId: aid,
        });
        const res = await waitForAssetReady(aid, {
          intervalMs: 4000,
          maxWaitMs: 120000,
          onTick: (status, url) => {
            console.log("[WriteStep][POLL TICK]", {
              status,
              hasUrl: !!url,
              url,
            });
          },
        });
        if (cancelled) return;

        setGeneratedImageUrl(res.assetUrl);
        setAiDone(true);
      } catch (e: any) {
        if (cancelled) return;
        setErrorMsg(
          e?.message || "생성 결과를 가져오는 중 오류가 발생했습니다."
        );
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    pollResult(id);
    return () => {
      cancelled = true;
    };
  }, [assetId, menuPosterId]);

  const canComplete = aiDone && text.trim().length >= 30 && !!generatedImageUrl;

  // 3) 작성 완료 → finalize만 수행하고, 성공 시 전송 모달 오픈
  const handleComplete = async () => {
    if (!canComplete || typeof assetId !== "number") {
      if (!aiDone || !generatedImageUrl) {
        showFailure("이미지 준비가 아직 완료되지 않았습니다.", "대기");
      } else {
        showFailure("설명을 30자 이상 작성해주세요.", "안내");
      }
      return;
    }

    // menuPosterId가 없으면 assetId를 대체키로 사용(백에서 동일 키 운용 가정)
    const posterIdForFinalize =
      typeof menuPosterId === "number" ? menuPosterId : assetId;

    if (typeof posterIdForFinalize !== "number") {
      showFailure("menuPosterId를 확인할 수 없습니다.", "오류");
      return;
    }

    try {
      setSaving(true);
      console.log("[WriteStep][FINALIZE] request", {
        menuPosterId: posterIdForFinalize,
        descLen: text.trim().length,
      });

      await finalizeMenuPoster({
        menuPosterId: posterIdForFinalize,
        description: text.trim(),
        type: "IMAGE",
      });

      console.log("[WriteStep][FINALIZE] success");

      // ✅ 성공 시 모달 오픈 & posterId 저장
      setFinalizedPosterId(posterIdForFinalize);
      setModalVisible(true);
    } catch (e: any) {
      console.log("[WriteStep][FINALIZE] error", e?.message || String(e));
      showFailure(e?.message || "최종 저장에 실패했습니다.", "오류");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    navigation.replace("MenuPosterWriteStep", {
      menuPosterId,
      storeName,
      assetId: assetIdFromRoute,
      storeId,
    });
  };

  // 모달 닫기 시: 네비게이션 없이 모달만 닫기 (중복 pop 방지)
  const handleModalClose = () => {
    setModalVisible(false);
  };

  // 모달에서 전송 성공 시: 가게 페이지로 이동
  const handleModalSent = () => {
    setModalVisible(false);
    if (typeof storeId === "number") {
      navigation.navigate("StoreScreen", {
        storeId,
        storeName,
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      enabled={Platform.OS === "android"}
      behavior="height"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
          </TouchableOpacity>
          {/* 하드코딩 제거: 실제 라우트에서 받은 가게명 표시 */}
          <Text style={styles.title}>{storeName ?? ""}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={width * 0.06} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardOpen ? 24 : 120 }}
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          <View style={styles.aiSection}>
            <Text style={styles.sectionTitle}>AI 포스터 생성</Text>

            {!!errorMsg && (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <Text style={{ color: "#D00", marginBottom: 10 }}>
                  {errorMsg}
                </Text>
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            )}

            {isGenerating && !errorMsg && (
              <View style={styles.loadingContainer}>
                <LottieView
                  source={LOADING_JSON}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                <Text style={styles.loadingText}>
                  {typeof assetId === "number"
                    ? "AI 포스터를 생성중입니다..."
                    : "요청 접수 완료, 대기 중..."}
                </Text>
                <Text style={styles.loadingSubText}>
                  약간의 시간이 소요됩니다
                </Text>
              </View>
            )}

            {aiDone && generatedImageUrl && (
              <View style={styles.aiCompleteContainer}>
                <Image
                  source={{ uri: generatedImageUrl }}
                  style={styles.generatedImage}
                  onError={(e) =>
                    console.log("Generated image load error:", e.nativeEvent)
                  }
                />
                <Text style={styles.aiCompleteText}>
                  AI 포스터 생성이 완료되었습니다!
                </Text>
                <Text style={styles.aiCompleteSubText}>
                  아래에 메뉴판 설명을 작성해주세요
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textSection}>
            <Text style={styles.sectionTitle}>메뉴판 설명 작성</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder={`메뉴판에 대한 설명을 자유롭게 작성해주세요 (30자 이상)`}
              placeholderTextColor="#999999"
              textAlignVertical="top"
              value={text}
              onChangeText={setText}
              maxLength={500}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              editable={!saving}
            />
            <View style={styles.textCounter}>
              <Text style={styles.counterText}>{text.trim().length}/500</Text>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottom,
            keyboardOpen ? { position: "relative", paddingBottom: 16 } : null,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.completeButton,
              (!canComplete || saving) && styles.completeButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!canComplete || saving}
            activeOpacity={canComplete && !saving ? 0.7 : 1}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>
                {!aiDone
                  ? typeof assetId === "number"
                    ? "AI 포스터 생성 중..."
                    : "대기 중..."
                  : text.trim().length < 30
                  ? "설명을 30자 이상 작성해주세요"
                  : "작성 완료"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ✅ 전송 여부 묻는 모달 */}
        <CompleteModal
          visible={modalVisible}
          onClose={handleModalClose}
          generatedContent={generatedImageUrl ?? undefined}
          menuInfo={storeName}
          contentType="image"
          menuPosterId={
            finalizedPosterId ??
            (typeof menuPosterId === "number" ? menuPosterId : assetId ?? 0)
          }
          onSent={handleModalSent}
        />

        {/* ✅ ResultModal (Alert 대체) */}
        <ResultModal
          visible={result.visible}
          type={result.type}
          title={result.title}
          message={result.message}
          onClose={
            result.onClose ||
            (() => setResult((p) => ({ ...p, visible: false })))
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, backgroundColor: "#F7F8F9" },
  aiSection: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  loadingContainer: { alignItems: "center", paddingVertical: 20 },
  lottie: { width: 150, height: 150, marginBottom: 16 },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  loadingSubText: { fontSize: 14, color: "#666666" },
  aiCompleteContainer: { alignItems: "center", paddingVertical: 20 },
  generatedImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: "#F0F0F0",
  },
  aiCompleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  aiCompleteSubText: { fontSize: 14, color: "#666666", textAlign: "center" },
  textSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 100,
  },
  textInput: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  textCounter: { alignItems: "flex-end", marginTop: 8 },
  counterText: { fontSize: 12, color: "#999999" },
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
  completeButton: {
    backgroundColor: "#fec566",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  retryText: { color: "#333", fontWeight: "600" },
});
