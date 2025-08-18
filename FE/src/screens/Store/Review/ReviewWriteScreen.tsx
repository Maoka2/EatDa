// src/screens/Store/ReviewWriteScreen.tsx
import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthStackParamList } from "../../../navigation/AuthNavigator";
import OCRStep from "./OCRStep";
import MenuSelectStep from "./MenuSelectStep";
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import ResultModal from "../../../components/ResultModal";
import {
  requestReviewAsset,
  pollReviewAsset,
  finalizeReview,
} from "./services/api";

// ============================
// Types
// ============================
type ContentType = "image" | "shorts_ray2" | "shorts_gen4" | null;
type Step = "ocr" | "menu" | "gen" | "write";

const contentTypeToApiType = {
  image: "IMAGE",
  shorts_ray2: "SHORTS_RAY_2",
  shorts_gen4: "SHORTS_GEN_4",
} as const;

type Props = NativeStackScreenProps<AuthStackParamList, "ReviewWriteScreen"> & {
  route: {
    params?: {
      storeId?: number;
      storeName?: string;
      address?: string;
    };
  };
};

// ============================
// Component
// ============================
export default function ReviewWriteScreen({ navigation, route }: Props) {
  // Flow state
  const [step, setStep] = useState<Step>("ocr");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<ContentType>(null);
  const [imgs, setImgs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [text, setText] = useState("");

  // Receipt
  const [receiptImageUri, setReceiptImageUri] = useState<string>("");

  // Review IDs / Result
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewAssetId, setReviewAssetId] = useState<number | null>(null);
  const [generatedAssetUrl, setGeneratedAssetUrl] = useState<string | null>(
    null
  );
  const [assetType, setAssetType] = useState<string | null>(null);

  // Auth
  const [accessToken, setAccessToken] = useState<string>("");
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  // Store
  const [storeId, setStoreId] = useState<number>(0);

  // Result modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState<"success" | "failure">(
    "success"
  );
  const [resultModalMessage, setResultModalMessage] = useState("");

  // ============================
  // Init: read params, token
  // ============================
  useEffect(() => {
    if (route && route.params && typeof route.params.storeId === "number") {
      setStoreId(route.params.storeId);
      console.log(
        "[ReviewWriteScreen] route.params.storeId =",
        route.params.storeId
      );
    } else {
      console.warn("[ReviewWriteScreen] storeId not provided in route params");
    }
  }, [route]);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          setAccessToken(token);
          console.log("[ReviewWriteScreen] accessToken loaded");
        } else {
          console.error("[ReviewWriteScreen] no accessToken");
          Alert.alert("오류", "로그인이 필요합니다.", [
            { text: "확인", onPress: () => navigation.goBack() },
          ]);
        }
      } catch (error) {
        console.error("[ReviewWriteScreen] failed to load token:", error);
        Alert.alert("오류", "인증 정보를 불러올 수 없습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsTokenLoading(false);
      }
    };

    getAccessToken();
  }, [navigation]);

  // Guard: storeId must exist after token loading
  useEffect(() => {
    if (!isTokenLoading) {
      if (!storeId || storeId <= 0) {
        Alert.alert("오류", "가게 정보가 없습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      }
    }
  }, [isTokenLoading, storeId, navigation]);

  // ============================
  // Handlers
  // ============================
  const handleClose = () => {
    navigation.goBack();
  };

  const handleOCRSuccess = (imageUri: string) => {
    console.log("[ReviewWriteScreen] OCR success:", imageUri);
    setReceiptImageUri(imageUri);
    setStep("menu");
  };

  const handleOCRFailure = () => {
    console.log("[ReviewWriteScreen] OCR failure");
    Alert.alert("알림", "영수증 인증에 실패했습니다. 다시 시도해주세요.");
  };

  const requestAIGeneration = async () => {
    try {
      // Validate required fields
      if (
        !type ||
        !prompt.trim() ||
        imgs.length === 0 ||
        selected.length === 0
      ) {
        console.error("[ReviewWriteScreen] missing required fields", {
          type,
          promptLen: prompt.trim().length,
          imgsLength: imgs.length,
          selectedLength: selected.length,
        });
        Alert.alert(
          "알림",
          "생성 유형, 이미지, 프롬프트, 메뉴 선택을 확인해주세요."
        );
        return;
      }

      if (!accessToken) {
        console.error("[ReviewWriteScreen] missing accessToken");
        return;
      }

      if (!storeId) {
        console.error("[ReviewWriteScreen] missing storeId");
        return;
      }

      setGenLoading(true);
      setAiOk(false);

      // Map type
      const apiType = contentTypeToApiType[type];

      // Parse menuIds
      const menuIds: number[] = [];
      for (let i = 0; i < selected.length; i++) {
        const raw = selected[i];
        const numId = parseInt(raw, 10);
        if (isNaN(numId)) {
          throw new Error("유효하지 않은 메뉴 ID: " + raw);
        }
        menuIds.push(numId);
      }

      console.log("[ReviewWriteScreen] requestReviewAsset:", {
        storeId,
        menuIds,
        type: apiType,
        promptPreview: prompt.substring(0, 100) + "...",
        imagesCount: imgs.length,
      });

      // Step 1: request asset
      const response = await requestReviewAsset(
        {
          storeId,
          menuIds,
          type: apiType,
          prompt,
          images: imgs,
        },
        accessToken
      );

      console.log("[ReviewWriteScreen] requestReviewAsset OK:", response);

      setReviewId(response.reviewId);
      setReviewAssetId(response.reviewAssetId);
      setStep("write");

      // Step 2: poll result
      try {
        console.log("[ReviewWriteScreen] start polling...");

        const result = await pollReviewAsset(
          response.reviewAssetId,
          accessToken,
          (attempt) => {
            if (attempt % 10 === 0) {
              console.log("[ReviewWriteScreen] polling attempt:", attempt);
            }
          }
        );

        if (result && result.status === "SUCCESS") {
          console.log("[ReviewWriteScreen] generation success:", result);
          let finalUrl: string | null = null;
          if (result.imageUrl) {
            finalUrl = result.imageUrl;
          } else if (result.shortsUrl) {
            finalUrl = result.shortsUrl;
          }

          setGeneratedAssetUrl(finalUrl);
          if (result.type) {
            setAssetType(result.type);
          } else {
            setAssetType(apiType);
          }
          setAiOk(true);
          console.log("[ReviewWriteScreen] finalUrl set:", finalUrl);
        } else {
          throw new Error("AI 리뷰 생성에 실패했습니다.");
        }
      } catch (pollError: any) {
        console.error("[ReviewWriteScreen] polling failed:", pollError);
        Alert.alert(
          "오류",
          "AI 생성 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      } finally {
        setGenLoading(false);
      }
    } catch (error: any) {
      console.error("[ReviewWriteScreen] requestAIGeneration failed:", error);
      setGenLoading(false);

      let errorMessage = "AI 리뷰 생성 요청에 실패했습니다.";
      if (error && error.message) {
        if (error.message.indexOf("Network") >= 0) {
          errorMessage = "네트워크 연결을 확인하고 다시 시도해주세요.";
        } else if (error.message.indexOf("500") >= 0) {
          errorMessage =
            "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      Alert.alert("오류", errorMessage);
    }
  };

  const handleWriteComplete = async () => {
    try {
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

      const menuIds: number[] = [];
      for (let i = 0; i < selected.length; i++) {
        const raw = selected[i];
        const numId = parseInt(raw, 10);
        if (isNaN(numId)) {
          throw new Error("유효하지 않은 메뉴 ID: " + raw);
        }
        menuIds.push(numId);
      }

      console.log("[ReviewWriteScreen] finalizeReview:", {
        reviewId,
        reviewAssetId,
        menuIds,
        descriptionPreview: text.substring(0, 50) + "...",
        type: assetType,
      });

      const result = await finalizeReview(
        {
          reviewId,
          reviewAssetId,
          description: text.trim(),
          type: assetType,
          menuIds,
        },
        accessToken
      );

      console.log("[ReviewWriteScreen] finalizeReview OK:", result);

      setResultModalType("success");
      setResultModalMessage("리뷰가 성공적으로 등록되었습니다!");
      setShowResultModal(true);
    } catch (error: any) {
      console.error("[ReviewWriteScreen] finalize failed:", error);

      let errorMessage = "리뷰 등록에 실패했습니다.";
      if (error && error.message) {
        if (error.message.indexOf("30자 이상") >= 0) {
          errorMessage = "리뷰는 30자 이상 작성해주세요.";
        } else if (error.message.indexOf("Network") >= 0) {
          errorMessage = "네트워크 연결을 확인하고 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }

      setResultModalType("failure");
      setResultModalMessage(errorMessage);
      setShowResultModal(true);
    }
  };

  const handleResultModalClose = () => {
    setShowResultModal(false);
    if (resultModalType === "success") {
      try {
        navigation.navigate("ReviewTabScreen");
      } catch (navError) {
        console.error("[ReviewWriteScreen] navigate error:", navError);
        navigation.goBack();
      }
    }
  };

  const nextMenu = () => {
    if (selected.length > 0) {
      setStep("gen");
    } else {
      Alert.alert("알림", "최소 하나의 메뉴를 선택해주세요.");
    }
  };

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
            },
          },
        ]
      );
    } else {
      setGenLoading(false);
      setAiOk(false);
      setStep("gen");
    }
  };

  const handleAddImage = (imageUrl: string) => {
    setImgs((prev) => [...prev, imageUrl]);
  };

  // ============================
  // Rendering
  // ============================
  if (isTokenLoading) {
    return <SafeAreaView style={styles.container}></SafeAreaView>;
  }

  if (!storeId || storeId <= 0) {
    return <SafeAreaView style={styles.container}></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === "ocr" && (
        <OCRStep
          onSuccess={handleOCRSuccess}
          onFailure={handleOCRFailure}
          onBack={handleOCRBack}
        ></OCRStep>
      )}

      {step === "menu" && (
        <MenuSelectStep
          selected={selected}
          onToggle={(id) => {
            setSelected((p) => {
              const exists = p.indexOf(id) >= 0;
              if (exists) {
                return p.filter((x) => x !== id);
              }
              return [...p, id];
            });
          }}
          onBack={handleMenuBack}
          onNext={nextMenu}
          storeId={storeId}
          accessToken={accessToken}
        ></MenuSelectStep>
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
        ></GenerateStep>
      )}

      {step === "write" && (
        <WriteStep
          isGenerating={genLoading}
          aiDone={aiOk}
          text={text}
          onChange={setText}
          onNext={handleWriteComplete}
          onBack={handleWriteBack}
          onClose={handleClose}
          generatedAssetUrl={generatedAssetUrl}
          generatedAssetType={assetType}
          reviewId={reviewId}
          reviewAssetId={reviewAssetId}
          accessToken={accessToken}
          selectedMenuIds={selected.map((id) => parseInt(id, 10))}
          storeId={storeId}
          onReviewComplete={(completedReviewId) => {
            console.log("리뷰 등록 완료:", completedReviewId);
          }}
        ></WriteStep>
      )}

      <ResultModal
        visible={showResultModal}
        type={resultModalType}
        title={
          resultModalType === "success" ? "리뷰 등록 완료!" : "리뷰 등록 실패"
        }
        message={resultModalMessage}
        onClose={handleResultModalClose}
      ></ResultModal>
    </SafeAreaView>
  );
}

// ============================
// Styles
// ============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
