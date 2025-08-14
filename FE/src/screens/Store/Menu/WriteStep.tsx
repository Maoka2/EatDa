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
import {
  finalizeMenuPoster,
  waitForMenuPosterReady,
  sendMenuPoster,
} from "./services/api";
import { useNavigation } from "@react-navigation/native";

interface Props {
  menuPosterId: number;
  onComplete: () => void;
}

export default function WriteStep({ menuPosterId, onComplete }: Props) {
  const [description, setDescription] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [assetId, setAssetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

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

  const handleComplete = async () => {
    if (!assetId) {
      setError("에셋 ID를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsWriting(true);

      console.log("[WriteStep] handleComplete START", {
        menuPosterId,
        assetId,
        descriptionLength: description.length,
      });

      // 1. Finalize 요청
      console.log("[WriteStep] Sending finalizeMenuPoster...");
      const finalizeRes = await finalizeMenuPoster({
        menuPosterId,
        menuPosterAssetId: assetId,
        description,
        type: "IMAGE",
      });
      console.log("[WriteStep] finalizeMenuPoster Response:", finalizeRes);

      // 2. Send 요청
      console.log("[WriteStep] Sending sendMenuPoster...");
      const sendRes = await sendMenuPoster({ menuPosterId });
      console.log("[WriteStep] sendMenuPoster Response:", sendRes);

      Alert.alert("성공", sendRes.message || "포스터가 전송되었습니다.");

      console.log("[WriteStep] handleComplete SUCCESS");
      onComplete();
    } catch (err: any) {
      console.error("[WriteStep] ERROR:", err);
      setError(err.message || "포스터 완료/전송 처리 중 오류 발생");
    } finally {
      setIsWriting(false);
    }
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
              <Text style={styles.completeButtonText}>완료 및 전송</Text>
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
