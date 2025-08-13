import React, { useState } from "react";
import { View, TouchableOpacity, Image, StyleSheet, Text } from "react-native";
import { Video } from "expo-av";
import { SvgProps } from "react-native-svg";

export interface ReviewItem {
  id: string;
  type: "image" | "video";
  uri: string;
  thumbnail?: string; // 비디오 썸네일
  title: string;
  description: string;
  likes: number;
  views: number;
  // 새로 추가된 필드들
  menuNames?: string[];
}

// 이벤트아이템 추가
export interface eventItem {
  id: string;
  eventName: string;
  eventDescription: string;
  uri: number;
  // storeId:string; 
  start_date: Date;
  end_date: Date;
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

  // 리뷰아이템인지, 이벤트아이템인지 구분
  let imgSource: { uri: string } | number;
  if ("type" in item) {
    // 그리드에서는 항상 thumbnail 사용 (이미지면 imageUrl, 비디오면 thumbnailUrl)
    imgSource = { uri: item.thumbnail || item.uri };
    
    console.log(`GridComponent - 리뷰 ${item.id}:`, {
      type: item.type,
      thumbnail: item.thumbnail,
      uri: item.uri,
      displayUri: item.thumbnail || item.uri
    });
  } else {
    imgSource = item.uri;
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
              console.error(`이미지 로드 실패 - 리뷰 ${("type" in item) ? item.id : 'event'}:`, error);
              setImageError(true);
            }}
          />
        ) : (
          // 이미지 로드 실패 시 대체 화면
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
