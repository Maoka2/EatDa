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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { waitForAssetReady, finalizeMenuPoster } from "./services/api";
import LoadingSpinner from "../../../components/LoadingSpinner";

// NOTE: 프로젝트 경로에 맞춰 필요 시 조정
const LOADING_JSON = require("../../../../assets/AI-loading.json");

type RouteParams = {
  menuPosterId: number;
  assetId: number; // 폴링은 assetId 기준
  storeName?: string; // 선택: 타이틀에 쓰고 싶으면 넘겨도 됨
};

export default function WriteStep() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { menuPosterId, assetId, storeName } = (route?.params ||
    {}) as RouteParams;

  const { width } = useWindowDimensions();

  // 내부 상태 (프레젠테이셔널 + 로직 통합)
  const [isGenerating, setIsGenerating] = useState(true);
  const [aiDone, setAiDone] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 폴링 시작
  useEffect(() => {
    if (typeof assetId !== "number") {
      setErrorMsg("유효한 assetId가 없습니다.");
      setIsGenerating(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setIsGenerating(true);
      setAiDone(false);
      setGeneratedImageUrl(null);
      setErrorMsg(null);

      try {
        console.log("[WriteStep] START POLLING", { menuPosterId, assetId });
        const res = await waitForAssetReady(assetId, {
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
        console.log("[WriteStep] READY", res);

        // 접근성/유효성 간단 프로브
        try {
          const probe = await fetch(res.assetUrl, { method: "GET" });
          console.log("[WriteStep][PROBE]", {
            status: probe.status,
            contentType: probe.headers.get("content-type"),
          });
        } catch (e: any) {
          console.log("[WriteStep][PROBE ERROR]", e?.message || String(e));
        }
      } catch (e: any) {
        if (cancelled) return;
        console.log("[WriteStep] POLLING ERROR", e?.message || String(e));
        setErrorMsg(
          e?.message || "생성 결과를 가져오는 중 오류가 발생했습니다."
        );
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [assetId, menuPosterId]);

  const canComplete = aiDone && text.trim().length > 30 && !!generatedImageUrl;

  const handleComplete = async () => {
    if (!canComplete) {
      if (!aiDone || !generatedImageUrl) {
        Alert.alert("대기", "이미지 준비가 아직 완료되지 않았습니다.");
      } else {
        Alert.alert("안내", "설명을 30자 이상 작성해주세요.");
      }
      return;
    }

    try {
      setSaving(true);
      console.log("[WriteStep][FINALIZE] request", {
        menuPosterId,
        assetId,
        descLen: text.trim().length,
      });

      await finalizeMenuPoster({
        menuPosterId,
        menuPosterAssetId: assetId,
        description: text.trim(),
        type: "IMAGE",
      });

      console.log("[WriteStep][FINALIZE] success");
      Alert.alert("완료", "메뉴판이 저장되었습니다.");
      navigation.goBack();
    } catch (e: any) {
      console.log("[WriteStep][FINALIZE] error", e?.message || String(e));
      Alert.alert("오류", e?.message || "최종 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    // 화면 다시 띄워 폴링 재시작
    navigation.replace("MenuPosterWriteStep", {
      menuPosterId,
      assetId,
      storeName,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{storeName || "햄찌네 피자"}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={width * 0.06} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 메인 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 상태 섹션 */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI 포스터 생성</Text>

          {/* 에러 */}
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

          {/* 대기(Lottie) */}
          {isGenerating && !errorMsg && (
            <View style={styles.loadingContainer}>
              <LottieView
                source={LOADING_JSON}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={styles.loadingText}>
                AI 포스터를 생성중입니다...
              </Text>
              <Text style={styles.loadingSubText}>
                약간의 시간이 소요됩니다
              </Text>
            </View>
          )}

          {/* 완료(이미지) */}
          {aiDone && generatedImageUrl && (
            <View style={styles.aiCompleteContainer}>
              <Image
                source={{ uri: generatedImageUrl }}
                style={styles.generatedImage}
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

        {/* 설명 입력 */}
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
          />
          <View style={styles.textCounter}>
            <Text style={styles.counterText}>{text.trim().length}/500</Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottom}>
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
                ? "AI 포스터 생성 중..."
                : text.trim().length <= 30
                ? "설명을 30자 이상 작성해주세요"
                : "작성 완료"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- 스타일 ---
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
