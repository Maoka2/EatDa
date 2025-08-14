// src/screens/Store/Menu/WriteStep.tsx

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { AuthStackParamList } from "../../../navigation/AuthNavigator";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import { waitForAssetReady, finalizeMenuPoster } from "./services/api";
import LoadingSpinner from "../../../components/LoadingSpinner";
import CompleteModal from "./CompleteModal";


type MenuPosterWriteRoute = RouteProp<
  AuthStackParamList,
  "MenuPosterWriteStep"
>;

export default function MenuPosterWriteStep() {
  // --- 로직: 기존 코드와 100% 동일 ---
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const route = useRoute<MenuPosterWriteRoute>();

  const menuPosterId = route?.params?.menuPosterId;
  const assetId = route?.params?.assetId;

  const [description, setDescription] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);

  const copy = {
    headerTitle: !isCompleted ? "메뉴판을 생성중입니다…" : "메뉴판 설명 작성",
    generatingTitle: "메뉴판을 생성중입니다…",
    generatingBody:
      "AI 메뉴판을 생성하는 데 약간의 시간이 소요됩니다! 잠시만 기다려주세요",
    promptTitle: "생성된 메뉴판에 대해 간략하게 설명해주세요",
    promptPlaceholder:
      "생성한 메뉴판의 컨셉에 대해서 간략하게 설명해주세요!\n강조하고 싶은 부분이 있다면 자유롭게 작성해주세요",
    button: "완료",
  };

  useEffect(() => {
    if (!Number.isFinite(menuPosterId) || !Number.isFinite(assetId)) {
      setError("유효한 메뉴 포스터/에셋 ID가 필요합니다.");
    }
  }, [menuPosterId, assetId]);

  useEffect(() => {
    if (!Number.isFinite(assetId)) return;
    let cancelled = false;
    (async () => {
      try {
        const { assetUrl } = await waitForAssetReady(assetId!, {
          intervalMs: 5000,
        });
        if (cancelled) return;
        setAssetUrl(assetUrl);
        setIsCompleted(true);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "에셋 생성 중 오류가 발생했습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const handleComplete = async () => {
    if (!Number.isFinite(menuPosterId) || !Number.isFinite(assetId)) {
      setError("유효한 메뉴 포스터/에셋 ID가 필요합니다.");
      return;
    }
    if (description.trim().length < 30) {
      setError("설명은 30자 이상 입력해주세요.");
      return;
    }
    try {
      setIsWriting(true);
      await finalizeMenuPoster({
        menuPosterId: menuPosterId!,
        menuPosterAssetId: assetId!,
        description,
        type: "IMAGE",
      });
      setSendModalVisible(true);
    } catch (e: any) {
      setError(e?.message || "포스터 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setIsWriting(false);
    }
  };
  
  const handleSentDone = () => {
    setSendModalVisible(false);
    Alert.alert("완료", "메뉴판이 성공적으로 등록/전송되었습니다.", [
      { text: "확인", onPress: () => navigation.goBack() },
    ]);
  };

  const isGenerating = !isCompleted;
  const descTooShort = description.trim().length < 30;
  const canSubmit =
    Number.isFinite(assetId) && !isGenerating && !isWriting && !descTooShort;
  // --- 로직 끝 ---

  
  // --- UI: 첫 번째 예제 스타일 적용 ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="chevron-back" size={width * 0.06} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{copy.headerTitle}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aiSection}>
          {isGenerating && (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require("../../../../assets/AI-loading.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={styles.loadingText}>{copy.generatingTitle}</Text>
              <Text style={styles.loadingSubText}>{copy.generatingBody}</Text>
            </View>
          )}

          {!isGenerating && (
             <View style={styles.aiCompleteContainer}>
              <View style={styles.aiCompleteIcon}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.aiCompleteText}>메뉴판 생성이 완료되었습니다!</Text>
            </View>
          )}
        </View>

        <View style={styles.textSection}>
          <Text style={styles.sectionTitle}>{copy.promptTitle}</Text>
          <Text style={styles.sectionSubtitle}>최소 30자 이상 작성해주세요</Text>
          <TextInput
            style={styles.textInput}
            placeholder={copy.promptPlaceholder}
            placeholderTextColor="#999999"
            value={description}
            onChangeText={setDescription}
            multiline
            editable={!isWriting}
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.textCounter}>
             <Text style={[
                styles.counterText,
                descTooShort && styles.counterTextWarning
             ]}>
              {description.length}/500 {descTooShort ? `(${30 - description.length}자 더 필요)` : ''}
            </Text>
          </View>
        </View>
         {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!canSubmit}
          activeOpacity={canSubmit ? 0.7 : 1}
        >
          {isWriting ? (
            <LoadingSpinner color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{copy.button}</Text>
          )}
        </TouchableOpacity>
      </View>

      <CompleteModal
        visible={sendModalVisible}
        onClose={() => setSendModalVisible(false)}
        generatedContent={assetUrl ?? undefined}
        onSent={handleSentDone}
        menuPosterId={menuPosterId!}
      />
    </SafeAreaView>
  );
}

// --- 스타일: 첫 번째 예제 스타일 적용 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
   backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  content: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  aiSection: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: "center",
  },
  lottie: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666666",
    textAlign: 'center',
  },
   aiCompleteContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  aiCompleteIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 24,
    color: "#00796b",
    fontWeight: "bold",
  },
  aiCompleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  textSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  textCounter: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  counterText: {
    fontSize: 12,
    color: "#999999",
  },
  counterTextWarning: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
});