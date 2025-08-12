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
// 화면 구성 요소들
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import CompleteModal from "./CompleteModal";
// API 통신 함수들
import {
  requestEventAsset,
  getEventAssetResult,
  finalizeEvent,
  downloadEventAsset,
} from "./services/api";

// 화면 단계 정의 ("만들기" 단계, "글쓰기" 단계)
type Step = "gen" | "write";

type Props = NativeStackScreenProps<AuthStackParamList, "EventMakingScreen">;

export default function EventMakingScreen({ navigation }: Props) {
  // --- 상태(State) 관리 ---

  // 1. 화면 단계 제어
  const [step, setStep] = useState<Step>("gen");

  // 2. 이벤트 생성을 위한 데이터
  const [eventName, setEventName] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState(""); // 최종 이벤트 설명글

  // 3. API 및 로딩 상태
  const [isLoading, setIsLoading] = useState(false); // 업로드/다운로드 등 일반 로딩
  const [genLoading, setGenLoading] = useState(false); // AI 이미지 생성 전용 로딩
  const [aiOk, setAiOk] = useState(false); // AI 생성이 성공했는지 여부
  const [assetUrl, setAssetUrl] = useState<string | null>(null); // 생성된 이미지의 URL
  const [eventAssetId, setEventAssetId] = useState<number | null>(null); // 생성된 에셋의 ID
  const [eventId, setEventId] = useState<number | null>(null); // 생성된 이벤트의 ID

  // 4. 완료 모달 제어
  const [isCompleteModalVisible, setCompleteModalVisible] = useState(false);

  // --- 핵심 로직 (함수) ---

  // AI가 이미지를 다 만들었는지 주기적으로 확인 (폴링)
  useEffect(() => {
    // 'write' 단계가 아니거나, 확인할 asset ID가 없으면 실행 안 함
    if (step !== "write" || !eventAssetId) {
      return;
    }

    setGenLoading(true); // AI 로딩 시작
    setAiOk(false);

    // 1초마다 getEventAssetResult 함수를 호출해서 상태 체크
    const intervalId = setInterval(async () => {
      try {
        const result = await getEventAssetResult(eventAssetId);
        console.log("폴링 결과:", result.code);

        // 성공 시, 로딩 멈추고 결과 저장
        if (result.code === "ASSET_GENERATION_SUCCESS") {
          clearInterval(intervalId);
          setAssetUrl(result.data.assetUrl);
          setGenLoading(false);
          setAiOk(true);
          // 실패 시, 로딩 멈추고 알림
        } else if (result.code === "ASSET_GENERATION_FAILED") {
          clearInterval(intervalId);
          setGenLoading(false);
          Alert.alert("생성 실패", "이벤트 에셋 생성에 실패했습니다.");
          setStep("gen"); // 첫 단계로 돌아가기
        }
      } catch (error: any) {
        clearInterval(intervalId);
        setGenLoading(false);
        Alert.alert("오류", error.message);
        setStep("gen");
      }
    }, 1000); // 1초 간격

    // 화면이 꺼지거나, 이 useEffect가 다시 실행될 때 interval을 정리
    return () => clearInterval(intervalId);
  }, [step, eventAssetId]); // step 또는 eventAssetId가 바뀔 때마다 실행

  // 맨 처음, 이벤트 정보와 프롬프트를 서버에 보내 AI 생성을 요청하는 함수
  const handleGenerateRequest = async () => {
    if (!startDate || !endDate) {
      Alert.alert("오류", "이벤트 기간을 설정해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      // API 호출에 필요한 데이터 묶기
      const eventRequestData = {
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
      // API 호출
      const result = await requestEventAsset(eventRequestData);
      // 결과로 받은 ID들을 상태에 저장
      setEventAssetId(result.eventAssetId);
      setEventId(result.eventId);
      console.log(
        `[EVENT] received ids → eventId=${result.eventId}, assetId=${result.eventAssetId}`
      );
      setStep("write"); // 다음 단계로 이동
    } catch (error: any) {
      Alert.alert("오류", error.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모달의 '업로드' 버튼을 눌렀을 때, 이벤트를 최종 등록하는 함수
  const handleConfirmFinalize = async () => {
    setCompleteModalVisible(false); // 먼저 모달을 닫고

    // 1. 유효성 검사
    if (!eventId || !eventAssetId) {
      Alert.alert("오류", "이벤트 정보가 올바르지 않습니다.");
      return;
    }
    if (text.trim().length < 30) {
      Alert.alert("입력 오류", "이벤트 본문은 30자 이상 입력해주세요.");
      return;
    }

    // 2. 로딩 시작 및 API 호출
    setIsLoading(true);
    try {
      await finalizeEvent({
        eventId,
        eventAssetId,
        description: text,
      });

      // 3. 성공 시 처리
      setIsLoading(false);
      Alert.alert("등록 완료", "이벤트가 성공적으로 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.navigate("ActiveEventScreen"), // 확인 누르면 목록으로
        },
      ]);
    } catch (error: any) {
      // 4. 실패 시 처리
      setIsLoading(false);
      Alert.alert(
        "등록 실패",
        error.message || "알 수 없는 오류가 발생했습니다."
      );
    }
  };

  // 모달의 '파일 저장' 버튼을 눌렀을 때, 이미지를 다운로드하는 함수
  const handleDownload = async () => {
    if (!eventAssetId) {
      Alert.alert("오류", "다운로드할 이미지 정보가 없습니다.");
      return;
    }
    setCompleteModalVisible(false); // 모달을 닫고
    await downloadEventAsset(eventAssetId); // api.ts에 만든 다운로드 함수 호출
  };

  // --- 자잘한 핸들러 함수들 ---
  const handleClose = () => navigation.goBack();
  const handleAddImage = (imageUrl: string) =>
    setImgs((prev) => [...prev, imageUrl]);
  const handleRemoveImage = (index: number) =>
    setImgs((prev) => prev.filter((_, idx) => idx !== index));
  const handleDateSelect = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // --- 화면 렌더링 ---
  return (
    <SafeAreaView style={styles.container}>
      {/* 1단계 화면 */}
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
          onNext={handleGenerateRequest} // '확인' 버튼 누르면 AI 생성 요청
          onBack={() => navigation.goBack()}
        />
      )}
      {/* 2단계 화면 */}
      {step === "write" && (
        <WriteStep
          isGenerating={genLoading}
          aiDone={aiOk}
          text={text}
          onChange={setText}
          onNext={() => setCompleteModalVisible(true)} // '작성 완료' 버튼 누르면 모달 띄우기
          onBack={() => {
            setGenLoading(false);
            setAiOk(false);
            setStep("gen");
          }}
          onClose={handleClose}
          generatedImageUrl={assetUrl}
        />
      )}

      {/* API 호출 시 사용될 범용 로딩 모달 */}
      <Modal visible={isLoading} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fec566" />
        </View>
      </Modal>

      {/* 생성 완료 후 나타나는 최종 확인 모달 */}
      <CompleteModal
        visible={isCompleteModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        generatedContent={assetUrl}
        onConfirm={handleConfirmFinalize} // '업로드' 버튼과 연결
        onDownload={handleDownload} // '파일 저장' 버튼과 연결
        onCancel={() => {
          // '다시 만들기' 버튼과 연결
          setCompleteModalVisible(false);
          setStep("gen");
        }}
      />
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
