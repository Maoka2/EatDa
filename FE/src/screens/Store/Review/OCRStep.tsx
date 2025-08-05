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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../../constants/theme";

interface BusinessLicenseUploadProps {
  onSuccess: (imageUri: string) => void;
  onFailure: () => void;
}

export default function OCRStep({
  onSuccess,
  onFailure,
}: BusinessLicenseUploadProps) {
  const { width, height } = useWindowDimensions();
  const [businessLicenseUri, setBusinessLicenseUri] = useState<string | null>(
    null
  );

  // 영수증 업로드
  const handleBusinessLicenseUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다");
        return;
      }

      Alert.alert("영수증 인증하기", "영수증을 어떻게 업로드하시겠습니까?", [
        {
          text: "카메라로 촬영",
          onPress: async () => {
            const { status: cameraStatus } =
              await ImagePicker.requestCameraPermissionsAsync();
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
              Alert.alert("업로드 완료", "영수증이 업로드되었습니다", [
                {
                  text: "확인",
                  onPress: () => onSuccess(uri),
                },
              ]);
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
              Alert.alert("업로드 완료", "영수증이 업로드되었습니다", [
                {
                  text: "확인",
                  onPress: () => onSuccess(uri),
                },
              ]);
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
      Alert.alert("오류", "영수증 업로드 중 오류가 발생했습니다");
      onFailure();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: width * 0.045 }]}>
          영수증 인증
        </Text>
        <Text style={[styles.description, { fontSize: width * 0.035 }]}>
          영수증 인증을 먼저 하셔야{"\n"}AI 리뷰를 생성할 수 있습니다
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.uploadArea, { height: height * 0.35 }]}
          onPress={handleBusinessLicenseUpload}
        >
          {businessLicenseUri ? (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
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
});
