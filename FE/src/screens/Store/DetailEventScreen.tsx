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
  selectedIndex: number;
  onClose: () => void;
  // storeName: string;
}

export default function ({
  events,
  selectedIndex,
  onClose,
}: DetailEventScreenProps) {
  const { width, height } = useWindowDimensions();
  const screenHeight = Dimensions.get("window").height;

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const event = events[selectedIndex];

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

        <View style={styles.ImageContainer}>
          <Image
            source={event.uri}
            style={[
              styles.eventImage,
              { width: width * 0.8, height: height * 0.4 },
            ]}
            resizeMode="cover"
          ></Image>
        </View>
        <View style={styles.eventTextContainer}>
          <Text style={styles.eventTitle}>{event.eventName}</Text>
          <Text style={styles.eventDescription}>{event.eventDescription}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  eventDetailContainer: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  } as ViewStyle,

  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingRight: 15,
    zIndex: 5,
  },

  storeName: {
    fontWeight: 500,
    textAlign: "center",
    fontSize: 20,
    paddingVertical:15,
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
    backgroundColor: "#F7F8F9",
  } as ViewStyle,

  eventTitle: {
    fontSize: 18,
    paddingBottom: 10,
  } as TextStyle,

  eventDescription: {
    fontSize: 14,
  } as TextStyle,
});
