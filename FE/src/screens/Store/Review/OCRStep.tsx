// 1. OCRStep.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../../constants/theme";
import ResultModal from "../../../components/ResultModal";
import { Ionicons } from "@expo/vector-icons";
import { requestReceiptOCR, getReceiptOCRResult } from "../../Store/Review/services/api"; // API import

interface BusinessLicenseUploadProps {
  onSuccess: (imageUri: string) => void;
  onFailure: () => void;
  onBack: () => void;
}

export default function OCRStep({
  onSuccess,
  onFailure,
  onBack,
}: BusinessLicenseUploadProps) {
  const { width, height } = useWindowDimensions();
  const [businessLicenseUri, setBusinessLicenseUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");
  const [modalMessage, setModalMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // 처리 중 상태

  // 모달 확인 버튼 핸들러
  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success" && businessLicenseUri) {
      onSuccess(businessLicenseUri);
    } else {
      onFailure();
    }
  };

  // 업로드 후 모달 띄우기
  const showResultModal = (type: "success" | "failure", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  // OCR 폴링 함수
  const pollReceiptOCR = async (assetId: number) => {
    let attempts = 0;
    const maxAttempts = 30; // 최대 30번 (30초)
    
    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        const result = await getReceiptOCRResult(assetId);
        
        if (result.status === "SUCCESS") {
          setIsProcessing(false);
          showResultModal("success", "영수증 인증이 완료되었습니다");
          return;
        } else if (result.status === "FAILED") {
          setIsProcessing(false);
          showResultModal("failure", "영수증 인증에 실패했습니다. 다시 시도해주세요");
          return;
        }
        // PENDING인 경우 계속 반복
        attempts++;
      } catch (error) {
        console.error("OCR polling error:", error);
        attempts++;
      }
    }
    
    // 타임아웃
    setIsProcessing(false);
    showResultModal("failure", "영수증 처리 시간이 초과되었습니다. 다시 시도해주세요");
  };

  // 영수증 OCR 처리
  const processReceiptOCR = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      console.log("[OCRStep] Starting receipt OCR for:", imageUri);
      
      // 1. OCR 요청
      const { assetId } = await requestReceiptOCR(imageUri);
      console.log("[OCRStep] OCR request successful, assetId:", assetId);
      
      // 2. 폴링 시작
      await pollReceiptOCR(assetId);
      
    } catch (error) {
      console.error("[OCRStep] OCR processing error:", error);
      setIsProcessing(false);
      showResultModal("failure", "영수증 업로드 중 오류가 발생했습니다");
    }
  };

  // 영수증 업로드
  const handleBusinessLicenseUpload = async () => {
    if (isProcessing) return; // 처리 중일 때는 무시
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다");
        return;
      }

      Alert.alert("영수증 인증하기", "영수증을 어떻게 업로드하시겠습니까?", [
        {
          text: "카메라로 촬영",
          onPress: async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== "granted") {
              Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다");
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });

            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setBusinessLicenseUri(uri);
              await processReceiptOCR(uri); // 실제 OCR 처리
            }
          },
        },
        {
          text: "갤러리에서 선택",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });

            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setBusinessLicenseUri(uri);
              await processReceiptOCR(uri); // 실제 OCR 처리
            }
          },
        },
        {
          text: "취소",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Business license upload error:", error);
      showResultModal("failure", "영수증 업로드 중 오류가 발생했습니다");
    }
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* 제목 및 설명 */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontSize: width * 0.045 }]}>
            영수증 인증
          </Text>
          <Text style={[styles.description, { fontSize: width * 0.035 }]}>
            영수증 인증을 먼저 하셔야{`\n`}AI 리뷰를 생성할 수 있습니다
          </Text>
        </View>

        {/* 업로드 영역 */}
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[
              styles.uploadArea, 
              { height: height * 0.35 },
              isProcessing && styles.uploadAreaDisabled
            ]}
            onPress={handleBusinessLicenseUpload}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryMaker} />
                <Text style={[styles.processingText, { fontSize: width * 0.04 }]}>
                  영수증을 분석 중입니다...
                </Text>
                <Text style={[styles.processingSubtext, { fontSize: width * 0.03 }]}>
                  잠시만 기다려주세요
                </Text>
              </View>
            ) : businessLicenseUri ? (
              <Image
                source={{ uri: businessLicenseUri }}
                style={styles.uploadedImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>📄</Text>
                <Text style={[styles.uploadText, { fontSize: width * 0.04 }]}>
                  영수증을 업로드하세요
                </Text>
                <Text style={[styles.uploadSubtext, { fontSize: width * 0.03 }]}>
                  JPG, PNG 파일만 업로드 가능합니다
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 결과 모달 */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  description: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  uploadContainer: {
    width: "100%",
    alignItems: "center",
  },
  uploadArea: {
    width: "100%",
    borderWidth: 2,
    borderColor: COLORS.inactive + "50",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  uploadAreaDisabled: {
    opacity: 0.7,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  uploadPlaceholder: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  uploadText: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  uploadSubtext: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
  },
  processingContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  processingText: {
    color: COLORS.text,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  processingSubtext: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
  },
});