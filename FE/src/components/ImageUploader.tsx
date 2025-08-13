import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';

interface ImageUploaderProps {
  images: (string | null)[]; // null을 허용하여 빈 슬롯 표현
  maxImages?: number;
  onAddImage: (index: number, imageUrl: string) => void; // index 추가
  onRemoveImage?: (index: number) => void;
  accentColor?: string;
  disabled?: boolean; // 비활성화 상태 추가
}

export default function ImageUploader({
  images,
  maxImages = 3,
  onAddImage,
  onRemoveImage,
  accentColor = "#FF69B4",
  disabled = false,
}: ImageUploaderProps) {
  
  // 이미지 권한 요청
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '이미지를 선택하려면 갤러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // 실제 이미지 선택 함수
  const handleAddImage = async (index: number) => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        onAddImage(index, imageUri);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  // 각 슬롯을 개별적으로 렌더링
  const renderSlots = (): React.JSX.Element[] => {
    const slots: React.JSX.Element[] = [];

    for (let i = 0; i < maxImages; i++) {
      const imageUrl = images[i];

      if (imageUrl) {
        // 이미지가 있는 슬롯
        slots.push(
          <View key={`slot-${i}`} style={styles.imageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.uploadedImage} />
            {onRemoveImage && !disabled && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: accentColor }]}
                onPress={() => onRemoveImage(i)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      } else {
        // 빈 슬롯 (추가 버튼)
        slots.push(
          <TouchableOpacity
            key={`slot-${i}`}
            style={[
              styles.addButton, 
              { borderColor: disabled ? "#ccc" : accentColor },
              disabled && styles.addButtonDisabled
            ]}
            onPress={() => handleAddImage(i)}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <View style={[
              styles.addIcon, 
              { backgroundColor: disabled ? "#ccc" : accentColor }
            ]}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <Text style={[
              styles.addText,
              { color: disabled ? "#ccc" : "#666" }
            ]}>
              이미지 추가
            </Text>
          </TouchableOpacity>
        );
      }
    }

    return slots;
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>{renderSlots()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {} as ViewStyle,
  imageContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-start",
  } as ViewStyle,
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  } as ViewStyle,
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  } as ImageStyle,
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  removeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 18,
  } as TextStyle,
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  } as ViewStyle,

  addButtonDisabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.5,
  } as ViewStyle,

  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  } as ViewStyle,
  addIconText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  } as TextStyle,

  addText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  } as TextStyle,
});