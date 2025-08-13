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

  // StoreScreen에서 넘겨준 파라미터
  const storeId = route?.params?.storeId;
  // (storeName, address는 필요시 MenuSelectStep UI에서 쓰도록 전달 가능하지만,
  // 지금 목표는 메뉴 불러오기 로직이므로 사용하지 않음)

  // MenuSelectStep 인터페이스에 맞춘 상태
  const [selected, setSelected] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");

  // storeId 유효성 체크
  useEffect(() => {
    if (!storeId || storeId <= 0) {
      Alert.alert("오류", "유효한 가게 ID가 없습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    }
  }, [storeId, navigation]);

  // 토큰 로드
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

  // MenuSelectStep 콜백
  const onToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onBack = () => navigation.goBack();

  const onNext = () => {
    // 다음 단계(프롬프트/이미지 업로드 → requestMenuPosterAsset 호출)는 이후에 붙임
    // 지금은 선택 완료만 확인
    if (!selected.length) {
      Alert.alert("알림", "메뉴를 한 개 이상 선택해주세요.");
      return;
    }
    // 이후 단계로 넘어갈 때 selected를 넘기면 됨
    // navigation.navigate("다음화면", { storeId, selectedMenuIds: selected.map(Number) });
    Alert.alert("선택 완료", `선택된 메뉴: ${selected.length}개`);
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
