import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { COLORS } from "../../../constants/theme";

type Props = {
  businessLicenseUri: string | null;
  onUpload: () => void;
};

export default function MakerStep2BusinessLicense({
  businessLicenseUri,
  onUpload,
}: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <Text style={[styles.desc, { fontSize: width * 0.035 }]}>
        사업자 등록증 이미지를 업로드하시면{"\n"}빠른 심사 후 승인해드립니다
      </Text>

      <TouchableOpacity
        style={[
          styles.uploadArea,
          { height: height * 0.25, marginBottom: height * 0.03 },
        ]}
        onPress={onUpload}
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
              사업자 등록증을 업로드하세요
            </Text>
            <Text style={[styles.uploadSubtext, { fontSize: width * 0.03 }]}>
              JPG, PNG 파일만 업로드 가능합니다
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flex: 1 },
  desc: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
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
  uploadedImage: { width: "100%", height: "100%", borderRadius: 12 },
  uploadPlaceholder: { alignItems: "center" },
  uploadIcon: { fontSize: 48, marginBottom: 10 },
  uploadText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  uploadSubtext: { color: COLORS.inactive },
});
