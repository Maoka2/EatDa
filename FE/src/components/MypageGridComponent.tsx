// src/components/MypageGridComponent.tsx
import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Video } from "expo-av";

export interface ReviewItem {
  id: string;
  type: "image" | "video";
  uri: string;
  thumbnail?: string; // 비디오 썸네일
  title: string;
  description: string;
  likes?: number;
  views?: number;
}

interface GridProps {
  item: ReviewItem;
  size: number;
  index: number;
  totalLength: number;
  onPress?: () => void;
}

// ✅ HTTP 썸네일 플레이스홀더(데이터 URI 미사용)
const HTTP_PLACEHOLDER =
  "https://dummyimage.com/600x600/eeeeee/aaaaaa.png&text=%20";

export default function GridComponent({
  item,
  size,
  index,
  totalLength,
  onPress,
}: GridProps) {
  const LastRow = index >= totalLength - (totalLength % 2 || 2);

  // ✅ data: URI(베이스64)면 안드로이드에서 안 뜨는 케이스가 있어 HTTP 플레이스홀더로 교체
  const materializedThumb =
    item.thumbnail && item.thumbnail.length > 0
      ? item.thumbnail.startsWith("data:")
        ? HTTP_PLACEHOLDER
        : item.thumbnail
      : HTTP_PLACEHOLDER;

  const src = item.type === "video" ? materializedThumb : item.uri;

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          width: size - 1,
          height: size - 1,
          marginRight: index % 2 !== 1 ? 16 : 0, // 간격 16
          marginBottom: !LastRow ? 16 : 0, // 간격 16
          backgroundColor: "#333", // 기존 유지
          borderRadius: 12, // 둥글게
          overflow: "hidden",
        }}
      >
        <Image
          // key로 강제 리렌더(썸네일 갱신시)
          key={src}
          source={{ uri: src }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}
