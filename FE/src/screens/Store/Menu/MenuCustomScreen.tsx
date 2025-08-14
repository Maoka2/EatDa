// src/screens/Store/Menu/MenuCustomScreen.tsx
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/AuthNavigator";
import { getTokens } from "../../Login/services/tokenStorage";

import MenuSelectStep from "./MenuSelectStep";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "MenuCustomScreen"
>;
type RouteProps = RouteProp<AuthStackParamList, "MenuCustomScreen">;

export default function MenuCustomScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const storeId = route?.params?.storeId;

  const [selected, setSelected] = useState<number[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    if (!storeId || storeId <= 0) {
      Alert.alert("오류", "유효한 가게 ID가 없습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    }
  }, [storeId, navigation]);

  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await getTokens();
        if (!accessToken) {
          Alert.alert("인증 오류", "로그인이 필요합니다.", [
            { text: "확인", onPress: () => navigation.navigate("Login") },
          ]);
          return;
        }
        setAccessToken(accessToken);
      } catch {
        Alert.alert("오류", "인증 정보를 불러오지 못했습니다.");
      }
    })();
  }, [navigation]);

  const onToggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onBack = () => navigation.goBack();

  const onNext = () => {
    if (!selected.length) {
      Alert.alert("알림", "메뉴를 한 개 이상 선택해주세요.");
      return;
    }

    // 다음 화면으로 넘어갈 때 storeId, 선택된 메뉴 배열 같이 넘김
    navigation.navigate("GenerateStep", {
      storeId,
      selectedMenuIds: selected,
    });
  };

  return (
    <MenuSelectStep
      selected={selected}
      onToggle={onToggle}
      onBack={onBack}
      onNext={onNext}
      storeId={storeId}
      accessToken={accessToken}
    />
  );
}
