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
} from "react-native";

interface ImageUploaderProps {
  images: (string | null)[]; // null을 허용하여 빈 슬롯 표현
  maxImages?: number;
  onAddImage: (index: number, imageUrl: string) => void; // index 추가
  onRemoveImage?: (index: number) => void;
  accentColor?: string;
}

// 더미 이미지 URL들
const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop",
];

export default function ImageUploader({
  images,
  maxImages = 3,
  onAddImage,
  onRemoveImage,
  accentColor = "#FF69B4",
}: ImageUploaderProps) {
  // 더미 이미지 추가 함수 - 특정 인덱스에 추가
  const handleAddImage = (index: number) => {
    // 랜덤하게 더미 이미지 선택 (또는 인덱스 기반)
    const dummyImageIndex = index % DUMMY_IMAGES.length;
    const dummyImageUrl = DUMMY_IMAGES[dummyImageIndex];

    onAddImage(index, dummyImageUrl);
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
            {onRemoveImage && (
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
            style={[styles.addButton, { borderColor: accentColor }]}
            onPress={() => handleAddImage(i)}
          >
            <View style={[styles.addIcon, { backgroundColor: accentColor }]}>
              <Text style={styles.addIconText}>+</Text>
            </View>
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

  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  addIconText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  } as TextStyle,
});
