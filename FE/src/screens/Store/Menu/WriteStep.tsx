// src/screens/MenuPosterMaking/Steps/WriteStep.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { finalizeMenuPoster, waitForMenuPosterReady } from "./services/api";
import { useNavigation } from "@react-navigation/native";
import CompleteModal from "../../Store/Menu/CompleteModal"; // 모달 경로에 맞게 조정

interface Props {
  menuPosterId: number;
  onComplete: () => void;
}

export default function WriteStep({ menuPosterId, onComplete }: Props) {
  const [description, setDescription] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [assetId, setAssetId] = useState<number | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 전송 확인 모달
  const [sendModalVisible, setSendModalVisible] = useState(false);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // 에셋 생성 완료 대기 (polling)
  useEffect(() => {
    let isCancelled = false;

    const fetchResult = async () => {
      try {
        setIsWriting(true);
        const result = await waitForMenuPosterReady(menuPosterId, {
          intervalMs: 5000,
        });
        if (!isCancelled) {
          setIsCompleted(true);
          setAssetId(result.assetId);
          setAssetUrl(result.assetUrl);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "에셋 생성 중 오류 발생");
        }
      } finally {
        setIsWriting(false);
      }
    };

    fetchResult();

    return () => {
      isCancelled = true;
    };
  }, [menuPosterId]);

  // 작성 완료(= finalize) 후 전송 모달 띄우기
  const handleComplete = async () => {
    if (!assetId) {
      setError("에셋 ID를 찾을 수 없습니다.");
      return;
    }
    if (description.trim().length < 30) {
      setError("설명은 30자 이상 입력해주세요.");
      return;
    }

    try {
      setIsWriting(true);

      // 1) 최종 등록(finalize)
      const finalizeRes = await finalizeMenuPoster({
        menuPosterId,
        menuPosterAssetId: assetId,
        description,
        type: "IMAGE",
      });

      // 2) 전송 모달 오픈 (실제 전송 API는 모달에서)
      setSendModalVisible(true);
    } catch (err: any) {
      setError(err.message || "포스터 완료 처리 중 오류 발생");
    } finally {
      setIsWriting(false);
    }
  };

  // 모달에서 전송까지 끝난 뒤 상위로 완료 알림
  const handleSentDone = () => {
    setSendModalVisible(false);
    onComplete();
  };

  const isButtonDisabled =
    description.trim().length < 30 || isWriting || !assetId;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>포스터 설명 작성</Text>

      {isCompleted ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="포스터 설명을 입력하세요 (30자 이상)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.completeButton,
              {
                backgroundColor: isButtonDisabled ? "#ccc" : "#4CAF50",
              },
            ]}
            onPress={handleComplete}
            disabled={isButtonDisabled}
          >
            {isWriting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>작성 완료</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>포스터 에셋 생성 중입니다...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color="red" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 전송 확인 모달: 실제 전송 API 호출은 모달 내부에서 진행 */}
      <CompleteModal
        visible={sendModalVisible}
        onClose={() => setSendModalVisible(false)}
        generatedContent={assetUrl ?? undefined}
        onSent={handleSentDone}
        menuPosterId={menuPosterId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  completeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    marginLeft: 8,
  },
});
