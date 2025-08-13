import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from "../../../navigation/AuthNavigator";
import OCRStep from "./OCRStep";
import MenuSelectStep from "./MenuSelectStep";
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import ResultModal from "../../../components/ResultModal"; // ⭐ ResultModal import 추가
import { requestReviewAsset, pollReviewAsset, finalizeReview } from "./services/api";

// API 타입에 맞춰 수정
type ContentType = "image" | "shorts_ray2" | "shorts_gen4" | null;
type Step = "ocr" | "menu" | "gen" | "write";

// API 타입 매핑 (API 명세서에 맞춤)
const contentTypeToApiType = {
  image: "IMAGE",
  shorts_ray2: "SHORTS_RAY_2", 
  shorts_gen4: "SHORTS_GEN_4",
} as const;

type Props = NativeStackScreenProps<AuthStackParamList, "ReviewWriteScreen"> & {
  route: {
    params?: {
      storeId?: number;
    };
  };
};

export default function ReviewWriteScreen({ navigation, route }: Props) {
  const [step, setStep] = useState<Step>("ocr");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<ContentType>(null);
  const [imgs, setImgs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [text, setText] = useState("");
  
  // 영수증 이미지 URI 저장
  const [receiptImageUri, setReceiptImageUri] = useState<string>("");
  
  // 리뷰 생성 관련 상태
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewAssetId, setReviewAssetId] = useState<number | null>(null);
  const [generatedAssetUrl, setGeneratedAssetUrl] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<string | null>(null);
  
  // AsyncStorage에서 가져올 데이터
  const [accessToken, setAccessToken] = useState<string>("");
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  
  // ⭐ ResultModal 상태 추가
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState<"success" | "failure">("success");
  const [resultModalMessage, setResultModalMessage] = useState("");
  
  // route params에서 storeId 가져오기
  const storeId = 9; 

  // 컴포넌트 마운트 시 AsyncStorage에서 토큰 가져오기
  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
          console.log("[ReviewWriteScreen] 토큰 로드 성공");
        } else {
          console.error("[ReviewWriteScreen] 토큰이 없음");
          Alert.alert("오류", "로그인이 필요합니다.", [
            { text: "확인", onPress: () => navigation.goBack() }
          ]);
        }
      } catch (error) {
        console.error("[ReviewWriteScreen] 토큰 가져오기 실패:", error);
        Alert.alert("오류", "인증 정보를 불러올 수 없습니다.", [
          { text: "확인", onPress: () => navigation.goBack() }
        ]);
      } finally {
        setIsTokenLoading(false);
      }
    };

    getAccessToken();
  }, [navigation]);

  // storeId 검증
  useEffect(() => {
    if (!isTokenLoading && !storeId) {
      Alert.alert("오류", "가게 정보가 없습니다.", [
        { text: "확인", onPress: () => navigation.goBack() }
      ]);
    }
  }, [isTokenLoading, storeId, navigation]);

  // 화면 닫기 핸들러
  const handleClose = () => {
    navigation.goBack();
  };

  // OCR 성공 핸들러
  const handleOCRSuccess = (imageUri: string) => {
    console.log("[ReviewWriteScreen] 영수증 인증 완료:", imageUri);
    setReceiptImageUri(imageUri);
    setStep("menu");
  };

  // OCR 실패 핸들러
  const handleOCRFailure = () => {
    console.log("[ReviewWriteScreen] 영수증 인증 실패");
    Alert.alert("알림", "영수증 인증에 실패했습니다. 다시 시도해주세요.");
  };

  // AI 리뷰 생성 요청 - 수정됨
  const requestAIGeneration = async () => {
    try {
      // 필수 데이터 검증
      if (!type || !prompt.trim() || imgs.length === 0 || selected.length === 0) {
        console.error("[ReviewWriteScreen] 필수 데이터 누락:", {
          type,
          prompt: prompt.trim(),
          imgsLength: imgs.length,
          selectedLength: selected.length
        });
        return;
      }

      if (!accessToken) {
        console.error("[ReviewWriteScreen] 액세스 토큰 없음");
        return;
      }

      if (!storeId) {
        console.error("[ReviewWriteScreen] 스토어 ID 없음");
        return;
      }

      // 로딩 시작
      setGenLoading(true);
      setAiOk(false);

      // API 타입 변환
      const apiType = contentTypeToApiType[type];
      
      // 메뉴 ID 변환 (string[] -> number[])
      const menuIds = selected.map(id => {
        const numId = parseInt(id, 10);
        if (isNaN(numId)) {
          throw new Error(`유효하지 않은 메뉴 ID: ${id}`);
        }
        return numId;
      });

      console.log("[ReviewWriteScreen] AI 리뷰 생성 요청 시작:", {
        storeId,
        menuIds,
        type: apiType,
        prompt: prompt.substring(0, 100) + "...", // 로그용으로 축약
        imagesCount: imgs.length
      });

      // 1단계: 리뷰 에셋 생성 요청
      const response = await requestReviewAsset({
        storeId,
        menuIds,
        type: apiType,
        prompt,
        images: imgs,
      }, accessToken);

      console.log("[ReviewWriteScreen] AI 리뷰 생성 요청 성공:", response);
      
      // 상태 업데이트
      setReviewId(response.reviewId);
      setReviewAssetId(response.reviewAssetId);
      
      // 다음 단계로 이동
      setStep("write");

      // 2단계: 폴링으로 결과 대기
      try {
        console.log("[ReviewWriteScreen] 폴링 시작...");
        
        const result = await pollReviewAsset(
          response.reviewAssetId, 
          accessToken,
          (attempt) => {
            if (attempt % 10 === 0) { // 10초마다 로그
              console.log(`[ReviewWriteScreen] 폴링 시도 ${attempt}번째...`);
            }
          }
        );

        if (result.status === "SUCCESS") {
          console.log("[ReviewWriteScreen] AI 리뷰 생성 완료:", result);
          
          // 생성된 결과 저장
          setGeneratedAssetUrl(result.imageUrl || result.shortsUrl || null);
          setAssetType(result.type || apiType);
          setAiOk(true);
          
          console.log("[ReviewWriteScreen] 결과 URL 설정됨:", {
            imageUrl: result.imageUrl,
            shortsUrl: result.shortsUrl,
            finalUrl: result.imageUrl || result.shortsUrl || null
          });
          
        } else {
          throw new Error("AI 리뷰 생성에 실패했습니다.");
        }
        
      } catch (pollError: any) {
        console.error("[ReviewWriteScreen] 폴링 실패:", pollError);
      } finally {
        setGenLoading(false);
      }

    } catch (error: any) {
      console.error("[ReviewWriteScreen] AI 리뷰 생성 요청 실패:", error);
      setGenLoading(false);
      
      let errorMessage = "AI 리뷰 생성 요청에 실패했습니다.";
      
      if (error.message) {
        if (error.message.includes("Network")) {
          errorMessage = "네트워크 연결을 확인하고 다시 시도해주세요.";
        } else if (error.message.includes("500")) {
          errorMessage = "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error("[ReviewWriteScreen] 처리된 에러 메시지:", errorMessage);
    }
  };

  // ⭐ WriteStep에서 완료 후 리뷰 최종 등록하는 핸들러 - ResultModal 사용으로 수정
  const handleWriteComplete = async () => {
    try {
      // 필수 데이터 검증
      if (!reviewId || !reviewAssetId || !text.trim()) {
        setResultModalType("failure");
        setResultModalMessage("리뷰 내용을 입력해주세요.");
        setShowResultModal(true);
        return;
      }

      if (text.trim().length < 30) {
        setResultModalType("failure");
        setResultModalMessage("리뷰는 30자 이상 작성해주세요.");
        setShowResultModal(true);
        return;
      }

      if (!assetType || !accessToken) {
        setResultModalType("failure");
        setResultModalMessage("리뷰 등록에 필요한 정보가 부족합니다.");
        setShowResultModal(true);
        return;
      }

      if (selected.length === 0) {
        setResultModalType("failure");
        setResultModalMessage("선택된 메뉴가 없습니다.");
        setShowResultModal(true);
        return;
      }

      // menuIds 변환
      const menuIds = selected.map(id => {
        const numId = parseInt(id, 10);
        if (isNaN(numId)) {
          throw new Error(`유효하지 않은 메뉴 ID: ${id}`);
        }
        return numId;
      });

      console.log("[ReviewWriteScreen] 리뷰 최종 등록 시작:", {
        reviewId,
        reviewAssetId,
        menuIds,
        description: text.substring(0, 50) + "...",
        type: assetType
      });

      // 3단계: 리뷰 최종 등록
      const result = await finalizeReview({
        reviewId,
        reviewAssetId,
        description: text.trim(),
        type: assetType,
        menuIds,
      }, accessToken);

      console.log("[ReviewWriteScreen] 리뷰 등록 완료:", result);
      
      // ⭐ 성공 시 ResultModal 표시
      setResultModalType("success");
      setResultModalMessage("리뷰가 성공적으로 등록되었습니다!");
      setShowResultModal(true);

    } catch (error: any) {
      console.error("[ReviewWriteScreen] 리뷰 등록 실패:", error);
      
      let errorMessage = "리뷰 등록에 실패했습니다.";
      
      if (error.message) {
        if (error.message.includes("30자 이상")) {
          errorMessage = "리뷰는 30자 이상 작성해주세요.";
        } else if (error.message.includes("Network")) {
          errorMessage = "네트워크 연결을 확인하고 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      // ⭐ 실패 시 ResultModal 표시
      setResultModalType("failure");
      setResultModalMessage(errorMessage);
      setShowResultModal(true);
    }
  };

  // ⭐ ResultModal 닫기 핸들러
  const handleResultModalClose = () => {
    setShowResultModal(false);
    
    // 성공한 경우에만 ReviewTabScreen으로 이동
    if (resultModalType === "success") {
      try {
        navigation.navigate("ReviewTabScreen");
      } catch (navError) {
        console.error("[ReviewWriteScreen] 네비게이션 오류:", navError);
        navigation.goBack();
      }
    }
    // 실패 시에는 모달만 닫고 현재 화면 유지
  };

  const nextMenu = () => {
    if (selected.length > 0) {
      setStep("gen");
    } else {
      Alert.alert("알림", "최소 하나의 메뉴를 선택해주세요.");
    }
  };

  // 각 단계별 뒤로가기 핸들러
  const handleOCRBack = () => {
    navigation.goBack();
  };

  const handleMenuBack = () => {
    setStep("ocr");
  };

  const handleGenBack = () => {
    setStep("menu");
  };

  const handleWriteBack = () => {
    // 생성 중이라면 사용자에게 확인 요청
    if (genLoading) {
      Alert.alert(
        "확인", 
        "AI 리뷰 생성이 진행 중입니다. 정말 이전 단계로 돌아가시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { 
            text: "확인", 
            onPress: () => {
              setGenLoading(false);
              setAiOk(false);
              setStep("gen");
            }
          }
        ]
      );
    } else {
      setGenLoading(false);
      setAiOk(false);
      setStep("gen");
    }
  };

  // 이미지 추가 함수
  const handleAddImage = (imageUrl: string) => {
    setImgs((prev) => [...prev, imageUrl]);
  };

  // 토큰 로딩 중이면 로딩 화면 표시
  if (isTokenLoading) {
    return <SafeAreaView style={styles.container} />;
  }

  // storeId가 없으면 빈 화면 (useEffect에서 처리됨)
  if (!storeId) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === "ocr" && (
        <OCRStep
          onSuccess={handleOCRSuccess}
          onFailure={handleOCRFailure}
          onBack={handleOCRBack}
        />
      )}

      {step === "menu" && (
        <MenuSelectStep
          selected={selected}
          onToggle={(id) =>
            setSelected((p) =>
              p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            )
          }
          onBack={handleMenuBack}
          onNext={nextMenu}
          storeId={storeId}
          accessToken={accessToken}
        />
      )}

      {step === "gen" && (
        <GenerateStep
          contentType={type}
          uploadedImages={imgs}
          prompt={prompt}
          onType={setType}
          onAdd={handleAddImage}
          onRemove={(i) => setImgs((p) => p.filter((_, idx) => idx !== i))}
          onPrompt={setPrompt}
          onNext={requestAIGeneration}
          onBack={handleGenBack}
          isLoading={genLoading}
        />
      )}

      {step === "write" && (
        <WriteStep
          isGenerating={genLoading}
          aiDone={aiOk}
          text={text}
          onChange={setText}
          onNext={handleWriteComplete} // ⭐ 이제 이 함수가 ResultModal을 처리
          onBack={handleWriteBack}
          onClose={handleClose}
          generatedAssetUrl={generatedAssetUrl}
          generatedAssetType={assetType}
          reviewId={reviewId}
          reviewAssetId={reviewAssetId}
          accessToken={accessToken}
          selectedMenuIds={selected.map(id => parseInt(id, 10))}
          storeId={storeId}
          onReviewComplete={(completedReviewId) => {
            console.log("리뷰 등록 완료:", completedReviewId);
            // ⭐ 이 콜백은 이제 사용되지 않음 (handleWriteComplete에서 직접 처리)
          }}
        />
      )}

      {/* ⭐ ResultModal 추가 */}
      <ResultModal
        visible={showResultModal}
        type={resultModalType}
        title={resultModalType === "success" ? "리뷰 등록 완료!" : "리뷰 등록 실패"}
        message={resultModalMessage}
        onClose={handleResultModalClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});