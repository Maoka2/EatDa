import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
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
  // onNavigate: () =>    // 추후에 가게페이지로 이동 시 사용하면 될 것 같음.
}

// 이벤트아이템 추가
export interface eventItem {
  id: string;
  eventName: string;
  eventDescription: string;
  uri: number;
  storeId?:string; 
  // eventStartDate:Date;
  // eventEndDate:Date;
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

  // 리뷰아이템인지, 이벤트아이템인지 구분
  let imgSource :{uri:string} | number;
  if("type" in item){
    imgSource = {uri: item.type === "video" ? (item.thumbnail || item.uri): item.uri};
  }else{
    imgSource = item.uri;
  } 

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
          source={imgSource}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}
