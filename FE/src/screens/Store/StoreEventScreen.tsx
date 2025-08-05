// src/screens/Store/StoreEventScreen.tsx

// 탭스위치에서 값이 === event 인 경우에 불러오기

import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { eventData } from "../../data/eventData";
import GridComponent, { eventItem } from "../../components/GridComponent";
import DetailEventScreen from "./DetailEventScreen";
import NoDataScreen from "../../components/NoDataScreen";

export default function StoreEventScreen() {
  // N*M 구조 만들기용
  const [containerWidth, setContainerWidth] = useState(0);

  // 전체보기 || 상세보기 구분용
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 정보 없을 때
  const isEmpty = !eventData || eventData.length === 0;
  return (
    isEmpty ? (
      <NoDataScreen></NoDataScreen>
    ) : 
    <View style={[{ flex: 1 }, {marginVertical:10}]}> 
      {selectedIndex !== null ? (
        <DetailEventScreen
          events={eventData}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        ></DetailEventScreen>
      ) : (
        // 전체보기
        <FlatList
          data={eventData}
          keyExtractor={(item) => item.id}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          numColumns={3}
          renderItem={({ item, index }) => (
            <GridComponent
              item={item}
              size={containerWidth / 3}
              index={index}
              totalLength={eventData.length}
              onPress={() => {
                setSelectedIndex(index);
              }}
            ></GridComponent>
          )}
        ></FlatList>
      )}
    </View>
  );
}
