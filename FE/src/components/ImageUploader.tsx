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
  images: string[];
  maxImages?: number;
  onAddImage: (imageUrl: string) => void;
  onRemoveImage?: (index: number) => void;
  accentColor?: string;
}

// 더미 이미지 URL들
const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop",
];

export default function ImageUploader({
  images,
  maxImages = 3,
  onAddImage,
  onRemoveImage,
  accentColor = "#FF69B4",
}: ImageUploaderProps) {
  const canAddMore = images.length < maxImages;

  // 더미 이미지 추가 함수
  const handleAddImage = () => {
    // 현재 이미지 개수에 따라 더미 이미지 선택
    const dummyImageIndex = images.length % DUMMY_IMAGES.length;
    const dummyImageUrl = DUMMY_IMAGES[dummyImageIndex];

    // 실제로는 onAddImage 콜백을 호출하되,
    // 부모 컴포넌트에서 더미 데이터를 추가하도록 알림
    onAddImage(dummyImageUrl);
  };

  // 총 3개의 슬롯을 보여주되, 빈 슬롯은 추가 버튼으로 표시
  const renderSlots = (): React.JSX.Element[] => {
    const slots: React.JSX.Element[] = [];

    // 업로드된 이미지들
    for (let i = 0; i < images.length; i++) {
      slots.push(
        <View key={`image-${i}`} style={styles.imageWrapper}>
          <Image source={{ uri: images[i] }} style={styles.uploadedImage} />
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
    }

    // 빈 슬롯들 (추가 버튼으로 표시)
    for (let i = images.length; i < maxImages; i++) {
      slots.push(
        <TouchableOpacity
          key={`add-${i}`}
          style={[styles.addButton, { borderColor: accentColor }]}
          onPress={handleAddImage}
          disabled={!canAddMore}
        >
          <View style={[styles.addIcon, { backgroundColor: accentColor }]}>
            <Text style={styles.addIconText}>+</Text>
          </View>
        </TouchableOpacity>
      );
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
