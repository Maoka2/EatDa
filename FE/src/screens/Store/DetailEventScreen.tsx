// src/screens/Store/DetailEventScreen.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  FlatList,
} from "react-native";
import { eventItem } from "../../components/GridComponent";
import CloseBtn from "../../../assets/closeBtn.svg";

interface DetailEventScreenProps {
  events: eventItem[];
  initialIndex: number;
  onClose: () => void;
  // storeName: string;
}

export default function ({
  events,
  initialIndex,
  onClose,
}: DetailEventScreenProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;
  const flatListRef = useRef<FlatList<eventItem>>(null);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const page = Math.round(offsetY / screenHeight);
    flatListRef.current?.scrollToOffset({
      offset: page * screenHeight,
      animated: false,
    });
  };

  return (
    // 클릭 시 확대 애니메이션
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <View style={styles.eventDetailContainer}>
        {/* 닫기버튼 */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <CloseBtn></CloseBtn>
        </TouchableOpacity>
        {/* <Text style={styles.storeName}>{storeName}</Text>*/}
        <Text style={styles.storeName}>햄찌네 가게</Text>
        <FlatList
          ref={flatListRef}
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[{ flex: 1 }, { height: screenHeight }]}>
              <View style={styles.ImageContainer}>
                <Image
                  source={item.uri}
                  style={[
                    styles.eventImage,
                    { width: width * 0.8, height: height * 0.4 },
                  ]}
                  resizeMode="cover"
                ></Image>
              </View>
              <View style={styles.eventTextContainer}>
                <Text style={styles.eventTitle}>{item.eventName}</Text>
                <Text style={styles.eventDescription}>
                  {item.eventDescription}
                </Text>
              </View>
            </View>
          )}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={screenHeight}
          snapToAlignment="start"
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: screenHeight,
            offset: screenHeight * index,
            index,
          })}
          onMomentumScrollEnd={handleMomentumEnd}
          windowSize={2}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          removeClippedSubviews
        ></FlatList>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  eventDetailContainer: {
    flex: 1,
    backgroundColor: "#F7F8F9",
    marginTop: 15,
  } as ViewStyle,

  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 15,
    zIndex: 5,
  },

  storeName: {
    fontWeight: 500,
    textAlign: "center",
    fontSize: 20,
    paddingVertical: 20,
  } as TextStyle,

  ImageContainer: {
    alignItems: "center",
  },

  eventImage: {
    borderRadius: 12,
  } as ImageStyle,

  eventTextContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "white",
  } as ViewStyle,

  eventTitle: {
    fontSize: 18,
    paddingBottom: 10,
  } as TextStyle,

  eventDescription: {
    fontSize: 14,
  } as TextStyle,
});
