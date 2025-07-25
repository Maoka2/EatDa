import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/AuthNavigator";
import Sidebar from "./src/components/Sidebar";

// SplashScreen이 자동으로 숨겨지지 않도록 설정
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // 1) useFonts로 커스텀 폰트 등록
  const [fontsLoaded] = useFonts({
    AlfaSlabOne: require("./assets/fonts/AlfaSlabOneRegular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // 폰트가 로딩될 때까지 대기
        if (fontsLoaded) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // SplashScreen 숨기기
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // 2) 아직 앱이 준비되지 않았다면 null 반환 (SplashScreen이 계속 보임)
  if (!appIsReady) {
    return null;
  }

  // 3) 폰트 로딩이 완료되면 네비게이터 렌더링
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </View>
  );
}
