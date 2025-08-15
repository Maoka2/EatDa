import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet, Text } from "react-native";

// GridComponent.tsx 타입 정의 수정
export interface ReviewItem {
  id: string;
  type: "image" | "video";
  uri: string; // 실제 미디어 URL
  thumbnail?: string; // 비디오 썸네일
  title: string;
  description: string;
  likes?: number;
  views?: number;
  menuNames?: string[];
}

// 이벤트 아이템 타입 수정
export interface eventItem {
  id: string;
  eventName: string;
  description: string; // eventDescription → description로 통일
  uri: { uri: string } | number; // 이미지 소스 타입
  start_date: Date;
  end_date: Date;
  storeName: string; // 누락된 필드 추가
}

interface GridProps {
  item: ReviewItem | eventItem;
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
  const [imageError, setImageError] = useState(false);

  // 이미지 소스 결정
  let imgSource: { uri: string } | number;
  
  if ("type" in item) {
    // ReviewItem인 경우
    imgSource = { uri: item.thumbnail || item.uri };
    console.log(`GridComponent - 리뷰 ${item.id}:`, {
      type: item.type,
      thumbnail: item.thumbnail,
      uri: item.uri,
      displayUri: item.thumbnail || item.uri
    });
  } else {
    // eventItem인 경우
    imgSource = item.uri;
    console.log(`GridComponent - 이벤트 ${item.id}:`, {
      uri: item.uri,
      storeName: item.storeName
    });
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={{
          width: size - 1,
          height: size - 1,
          marginRight: index % 3 !== 2 ? 2 : 0,
          marginBottom: !LastRow ? 2 : 0,
          backgroundColor: "#333",
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {!imageError ? (
          <Image
            source={imgSource}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={(error) => {
              console.error(`이미지 로드 실패 - ${("type" in item) ? "리뷰" : "이벤트"} ${item.id}:`, error);
              setImageError(true);
            }}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>이미지를 불러올 수 없습니다</Text>
          </View>
        )}
        
        {/* 비디오 표시 아이콘 */}
        {"type" in item && item.type === "video" && (
          <View style={styles.videoIndicator}>
            <View style={styles.playIcon} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
