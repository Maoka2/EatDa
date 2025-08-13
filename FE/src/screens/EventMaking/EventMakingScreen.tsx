import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  Modal,
  View,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import * as FileSystem from "expo-file-system";

// 화면 구성 요소들
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import CompleteModal from "./CompleteModal";
import ResultModal from "../../components/ResultModal";

// API 통신 함수들
import {
  requestEventAsset,
  finalizeEvent,
  downloadEventAsset,
  waitForAssetReady,
} from "./services/api";

// 화면 단계 정의
type Step = "gen" | "write";
type Props = NativeStackScreenProps<AuthStackParamList, "EventMakingScreen">;

export default function EventMakingScreen({ navigation }: Props) {
  // --- 상태 ---
  const [step, setStep] = useState<Step>("gen");
  const [eventName, setEventName] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [eventAssetId, setEventAssetId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [isCompleteModalVisible, setCompleteModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [cachedLocalPath, setCachedLocalPath] = useState<string | null>(null);
  // --- 에셋 준비 대기 ---
  const watchAssetUntilReady = async (assetId: number) => {
    console.log(`[ASSET] 생성 대기 시작 → assetId=${assetId}`);
    setGenLoading(true);
    setAiOk(false);
    setAssetUrl(null);

    try {
      const { posterUrl } = await waitForAssetReady(assetId, {
        intervalMs: 5000,
        maxWaitMs: 120000,
        onTick: ({ status, posterUrl }) => {
          console.log(
            `[ASSET] 폴링 결과: status=${status ?? "UNKNOWN"} url=${
              posterUrl ?? "-"
            }`
          );
        },
      });

      console.log(`[ASSET] 생성 완료! URL=${posterUrl}`);
      setAssetUrl(posterUrl);
      setAiOk(true);
      setIsResultModalVisible(true);

      try {
        const ext =
          posterUrl
            .match(/\.(png|jpg|jpeg|webp)(?=($|\?))/i)?.[1]
            ?.toLowerCase() || "png";
        const localPath =
          FileSystem.cacheDirectory + `event-poster-${assetId}.${ext}`;
        const dl = await FileSystem.downloadAsync(posterUrl, localPath);
        console.log("[ASSET] prefetched to cache:", dl.uri);
        setCachedLocalPath(dl.uri); // 나중에 저장 버튼에서 이 경로 먼저 사용
      } catch (e) {
        console.warn("[ASSET] prefetch-failed (will try later):", e);
      }
    } catch (e: any) {
      console.error("[ASSET] 생성 실패:", e);
      Alert.alert(
        "생성 실패",
        e?.message || "이벤트 에셋 생성에 실패했습니다."
      );
      setStep("gen");
    } finally {
      setGenLoading(false);
    }
  };

  // --- 이벤트 생성 요청 ---
  const handleGenerateRequest = async () => {
    if (!startDate || !endDate) {
      Alert.alert("오류", "이벤트 기간을 설정해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const eventRequestData = {
        title: eventName,
        type: "IMAGE",
        startDate,
        endDate,
        prompt,
        images: imgs.map((uri) => {
          const filename = uri.split("/").pop() || "image.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          return { uri, type, name: filename };
        }),
      };
      const result = await requestEventAsset(eventRequestData);
      setEventAssetId(result.eventAssetId);
      setEventId(result.eventId);

      console.log(
        `[EVENT] 생성 요청 완료 → eventId=${result.eventId}, assetId=${result.eventAssetId}`
      );

      setStep("write");
      watchAssetUntilReady(result.eventAssetId);
    } catch (error: any) {
      console.error("[EVENT] 생성 요청 실패:", error);
      Alert.alert("오류", error.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 이벤트 최종 등록 ---
  const handleConfirmFinalize = async () => {
    setCompleteModalVisible(false);

    if (!eventId || !eventAssetId) {
      Alert.alert("오류", "이벤트 정보가 올바르지 않습니다.");
      return;
    }
    if (!aiOk || !assetUrl) {
      Alert.alert("대기 중", "이미지 생성이 끝나면 등록할 수 있습니다.");
      return;
    }
    if (text.trim().length < 30) {
      Alert.alert("입력 오류", "이벤트 본문은 30자 이상 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[FINALIZE] 요청 데이터:", {
        eventId,
        eventAssetId,
        description: text,
      });

      const res = await finalizeEvent({
        eventId,
        eventAssetId,
        description: text,
      });

      console.log("[FINALIZE] 성공 응답:", res);

      setIsLoading(false);
      Alert.alert("등록 완료", "이벤트가 성공적으로 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.navigate("ActiveEventScreen"),
        },
      ]);
    } catch (error: any) {
      console.error("[FINALIZE] 실패:", error);
      setIsLoading(false);
      Alert.alert(
        "등록 실패",
        error.message || "알 수 없는 오류가 발생했습니다."
      );
    }
  };

  // --- 이미지 다운로드 ---
  const handleDownload = async () => {
    if (!eventAssetId) {
      Alert.alert("오류", "다운로드할 이미지 정보가 없습니다.");
      return;
    }
    await downloadEventAsset(eventAssetId, {
      assetUrl: assetUrl,
      cachedLocalPath: cachedLocalPath,
    });
  };

  // --- 기타 핸들러 ---
  const handleClose = () => navigation.goBack();
  const handleAddImage = (imageUrl: string) =>
    setImgs((prev) => [...prev, imageUrl]);
  const handleRemoveImage = (index: number) =>
    setImgs((prev) => prev.filter((_, idx) => idx !== index));
  const handleDateSelect = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === "gen" && (
        <GenerateStep
          eventName={eventName}
          uploadedImages={imgs}
          startDate={startDate}
          endDate={endDate}
          prompt={prompt}
          onEventName={setEventName}
          onAdd={handleAddImage}
          onRemove={handleRemoveImage}
          onDateSelect={handleDateSelect}
          onPrompt={setPrompt}
          onNext={handleGenerateRequest}
          onBack={() => navigation.goBack()}
        />
      )}
      {step === "write" && (
        <WriteStep
          isGenerating={genLoading}
          aiDone={aiOk}
          text={text}
          onChange={setText}
          onNext={() => setCompleteModalVisible(true)}
          onBack={() => {
            setGenLoading(false);
            setAiOk(false);
            setStep("gen");
          }}
          onClose={handleClose}
          generatedImageUrl={assetUrl}
        />
      )}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fec566" />
        </View>
      </Modal>
      <CompleteModal
        visible={isCompleteModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        generatedContent={assetUrl}
        onConfirm={handleConfirmFinalize}
        onDownload={handleDownload}
        onCancel={() => {
          setCompleteModalVisible(false);
          setStep("gen");
        }}
      />

      <ResultModal
        visible={isResultModalVisible}
        type="success"
        title="생성 완료!"
        message="AI 포스터 생성이 완료되었습니다."
        onClose={() => setIsResultModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
