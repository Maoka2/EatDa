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
  likes: number;
  views: number;
  // onNavigate: () =>    // 추후에 가게페이지로 이동 시 사용하면 될 것 같음.
}

interface GridProps {
  item: ReviewItem;
  size: number;
  index: number;
  totalLength: number;
  onPress?: () => void;
}

export default function GridComponent({
  item,
  size,
  index,
  totalLength,
  onPress,
}: GridProps) {
  const LastRow = index >= totalLength - (totalLength % 3 || 3);
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          width: size - 1, 
          height: size - 1,
          marginRight: index % 3 !== 2 ? 2 : 0, // 안겹치게 
          marginBottom: !LastRow ? 2 : 0,
          backgroundColor: "#333", 
        }}
      >
        <Image
          source={{ uri: item.type === "video" ? item.thumbnail : item.uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}
