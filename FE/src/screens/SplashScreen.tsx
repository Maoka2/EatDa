import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { COLORS, textStyles } from "../constants/theme";

type SplashScreenProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width: rawWidth, height: rawHeight } = useWindowDimensions();
  const width = Math.round(rawWidth);
  const height = Math.round(rawHeight);

  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // 안전장치: 최대 30초 후 강제 종료 (비디오가 너무 길거나 문제가 생겼을 때)
    const safetyTimer = setTimeout(() => {
      console.log("Safety timeout reached, proceeding to app");
      onFinish();
    }, 30000); // 30초

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [onFinish]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      // 비디오가 끝나면 앱으로 이동
      if (status.didJustFinish) {
        console.log("Video playback completed, proceeding to app");
        onFinish();
      }
    }
  };

  const handleVideoError = (error: string) => {
    console.log("Video error occurred:", error);
    // 비디오 에러 시 바로 앱으로 이동
    onFinish();
  };

  const handleLoad = () => {
    console.log("Video loaded successfully!");
    setVideoReady(true);
  };

  return (
    <View style={styles.container}>
      {/* 전체 화면 비디오 */}
      <Video
        source={require("../../assets/intro.mp4")}
        style={[styles.fullScreenVideo, { width, height }]}
        shouldPlay={true}
        isLooping={false} // 루프 비활성화 - 한 번만 재생
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        volume={0}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleVideoError}
      />

      {/* 로고 오버레이 - 비디오 위에 표시 */}
      <View style={styles.logoOverlay}>
        <View style={styles.logoContainer}>
          <View style={styles.logoTextContainer}>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.15, color: COLORS.primaryEater },
              ]}
            >
              E
            </Text>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.2, color: COLORS.secondaryMaker },
              ]}
            >
              a
            </Text>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.15, color: COLORS.primaryMaker },
              ]}
            >
              t
            </Text>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.2, color: COLORS.secondaryEater },
              ]}
            >
              D
            </Text>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.15, color: COLORS.primaryEater },
              ]}
            >
              a
            </Text>
            <Text
              style={[
                textStyles.logo,
                styles.logoChar,
                { fontSize: width * 0.2, color: COLORS.primaryMaker },
              ]}
            >
              !
            </Text>
          </View>
        </View>
      </View>

      {/* 반투명 오버레이 (선택사항 - 로고 가독성 향상) */}
      <View style={styles.dimOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1, // 가장 뒤에 배치
  },
  logoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3, // 로고를 가장 앞에 배치
  },
  logoContainer: {
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoChar: {
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  dimOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
});
