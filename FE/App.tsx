// App.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StatusBar } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { useKeepAwake } from "expo-keep-awake";
import AuthNavigator from "./src/navigation/AuthNavigator";
import SplashScreenVideo from "./src/screens/SplashScreen";
import StoreScreen from "./src/screens/Store/StoreScreen";
import MypageScreen from "./src/screens/Mypage/MypageScreen";
import EaterMypageDetail from "./src/screens/Mypage/EaterMypageDetail";
import MakerMyPage from "./src/screens/Mypage/MakerMypage";
import EaterMypage from "./src/screens/Mypage/EaterMypageDetail";
// 네이티브 스플래시 자동 숨김 방지
SplashScreen.preventAutoHideAsync();
export default function App() {
  // 개발 중에만 화면 깨어있게 유지
  if (__DEV__) {
    useKeepAwake();
  }

  const [appIsReady, setAppIsReady] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    AlfaSlabOne: require("./assets/fonts/AlfaSlabOneRegular.ttf"),
  });

  // 폰트 로드 완료 시 네이티브 스플래시 숨기기
  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 폰트 로딩 중
  if (!appIsReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#000",
            fontSize: 18,
            textAlign: "center",
            padding: 20,
          }}
        >
          Loading Fonts...{"\n"}
          Loaded: {fontsLoaded ? "YES" : "NO"}
          {"\n"}
          Error: {fontError ? "YES" : "NO"}
        </Text>
      </View>
    );
  }

  // 인트로 비디오 재생
  if (showVideo) {
    return <SplashScreenVideo onFinish={() => setShowVideo(false)} />;
  }

  // 메인 앱
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar
        barStyle="dark-content"
        translucent={true}
        backgroundColor="transparent"
      />
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </View>
  );
}
