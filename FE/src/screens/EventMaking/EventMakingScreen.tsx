import React, { useState, useEffect } from "react";
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
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import { requestEventAsset, getEventAssetResult } from "./services/api";

type Step = "gen" | "write";

type Props = NativeStackScreenProps<AuthStackParamList, "EventMakingScreen">;

export default function EventMakingScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>("gen");

  // 이벤트 관련 state들
  const [eventName, setEventName] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // API 요청 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [eventAssetId, setEventAssetId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  // AI 생성 관련 state들 (WriteStep으로 전달)
  const [genLoading, setGenLoading] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [text, setText] = useState("");
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  // AI 생성 결과를 주기적으로 물어보는 폴링 로직
  useEffect(() => {
    if (step !== "write" || !eventAssetId) {
      return;
    }

    setGenLoading(true);
    setAiOk(false);

    const intervalId = setInterval(async () => {
      try {
        const result = await getEventAssetResult(eventAssetId);
        console.log("폴링 결과:", result.code);

        if (result.code === "ASSET_GENERATION_SUCCESS") {
          clearInterval(intervalId);
          setAssetUrl(result.data.assetUrl);
          setGenLoading(false);
          setAiOk(true);
        } else if (result.code === "ASSET_GENERATION_FAILED") {
          clearInterval(intervalId);
          setGenLoading(false);
          Alert.alert("생성 실패", "이벤트 에셋 생성에 실패했습니다.");
          setStep("gen");
        }
      } catch (error: any) {
        clearInterval(intervalId);
        setGenLoading(false);
        Alert.alert("오류", error.message);
        setStep("gen");
      }
    }, 1000); // 몇초마다

    return () => clearInterval(intervalId);
  }, [step, eventAssetId]);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleGenerateRequest = async () => {
    if (!startDate || !endDate) {
      Alert.alert("오류", "이벤트 기간을 설정해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const eventRequestData = {
        // storeId: 1, // TODO: 내일 백엔드와 논의 후 실제 storeId로 교체
        title: eventName,
        type: "IMAGE",
        startDate: startDate,
        endDate: endDate,
        prompt: prompt,
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
        `[EVENT] received ids → eventId=${result.eventId}, assetId=${result.eventAssetId}`
      );
      setStep("write");
    } catch (error: any) {
      Alert.alert("오류", error.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWriteComplete = () => {
    console.log("이벤트 포스터 생성 완료 - 이벤트 페이지로 이동");
    navigation.navigate("ActiveEventScreen");
  };

  const handleAddImage = (imageUrl: string) => {
    setImgs((prev) => [...prev, imageUrl]);
  };
  const handleRemoveImage = (index: number) => {
    setImgs((prev) => prev.filter((_, idx) => idx !== index));
  };
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
          onNext={handleWriteComplete}
          onBack={() => {
            setGenLoading(false);
            setAiOk(false);
            setStep("gen");
          }}
          onClose={handleClose}
          generatedImageUrl={assetUrl}
        />
      )}
      <Modal visible={isLoading} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fec566" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
