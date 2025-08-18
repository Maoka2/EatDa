// src/screens/Login/SplashScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { COLORS, textStyles } from "../constants/theme";

type SplashScreenProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width: rawW, height: rawH } = useWindowDimensions();
  const width = Math.round(rawW);
  const height = Math.round(rawH);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onFinish, 30000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const onStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      onFinish();
    }
  };

  const onLoad = () => setVideoReady(true);
  const onError = () => onFinish();

  return (
    <View style={styles.container}>
      <Video
        source={require("../../assets/intro.mp4")}
        style={[styles.video, { width, height }]}
        shouldPlay
        isLooping={false}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        volume={0}
        onLoad={onLoad}
        onPlaybackStatusUpdate={onStatusUpdate}
        onError={onError}
      />

      {/** 로고만 표시: 화면 높이의 25% 지점으로 이동 **/}
      <View style={[styles.logoOverlay, { top: height * 0.1 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoTextContainer}>
            {[
              { char: "E", size: 0.15, color: COLORS.primaryEater },
              { char: "a", size: 0.2, color: COLORS.secondaryMaker },
              { char: "t", size: 0.15, color: COLORS.primaryMaker },
              { char: "D", size: 0.2, color: COLORS.secondaryEater },
              { char: "a", size: 0.15, color: COLORS.primaryEater },
              { char: "!", size: 0.2, color: COLORS.secondaryMaker },
            ].map((item, i) => (
              <Text
                key={i}
                style={[
                  textStyles.logo,
                  styles.logoChar,
                  { fontSize: width * item.size, color: item.color },
                ]}
              >
                {item.char}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  logoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoTextContainer: {
    flexDirection: "row",
  },
  logoChar: {
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
});
