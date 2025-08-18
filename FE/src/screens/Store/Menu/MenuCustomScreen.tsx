import React, { useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/AuthNavigator";
import { getTokens } from "../../Login/services/tokenStorage";

import MenuSelectStep from "./MenuSelectStep";
import ResultModal from "../../../components/ResultModal";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "MenuCustomScreen"
>;
type RouteProps = RouteProp<AuthStackParamList, "MenuCustomScreen">;

export default function MenuCustomScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const storeId = route?.params?.storeId;
  const storeName = route?.params?.storeName ?? ""; // ✅ 함께 전달

  const [selected, setSelected] = useState<number[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");

  // ResultModal 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalMessage, setModalMessage] = useState<string>("");
  const pendingActionRef = useRef<(() => void) | null>(null);

  const openModal = (
    type: "success" | "failure",
    title: string,
    message: string,
    onAfterClose?: () => void
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    pendingActionRef.current = onAfterClose ?? null;
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (pendingActionRef.current) {
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      fn();
    }
  };

  useEffect(() => {
    if (!storeId || storeId <= 0) {
      openModal("failure", "오류", "유효한 가게 ID가 없습니다.", () =>
        navigation.goBack()
      );
    }
  }, [storeId, navigation]);

  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await getTokens();
        if (!accessToken) {
          openModal("failure", "인증 오류", "로그인이 필요합니다.", () =>
            navigation.navigate("Login")
          );
          return;
        }
        setAccessToken(accessToken);
      } catch {
        openModal("failure", "오류", "인증 정보를 불러오지 못했습니다.");
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
      openModal("failure", "알림", "메뉴를 한 개 이상 선택해주세요.");
      return;
    }

    // ✅ 다음 화면으로 storeId + storeName + 선택된 메뉴 전달
    navigation.navigate("GenerateStep", {
      storeId,
      selectedMenuIds: selected,
      storeName,
    });
  };

  return (
    <>
      <MenuSelectStep
        selected={selected}
        onToggle={onToggle}
        onBack={onBack}
        onNext={onNext}
        storeId={storeId}
        accessToken={accessToken}
      />

      <ResultModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </>
  );
}
