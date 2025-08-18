// src/components/ResultModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import ModalSuccessIcon from "../../assets/modal_success.svg";
import ModalFailIcon from "../../assets/modal_fail.svg";
import { COLORS, textStyles } from "../constants/theme";

type ResultModalProps = {
  visible: boolean;
  type: "success" | "failure";
  title?: string; // 커스텀 제목을 위한 선택적 prop
  message: string;
  onClose: () => void;
};

export default function ResultModal({
  visible,
  type,
  title,
  message,
  onClose,
}: ResultModalProps) {
  const { width, height } = useWindowDimensions();
  const modalWidth = width * 0.8;

  // title이 제공되지 않으면 기본값 사용
  const modalTitle = title || (type === "success" ? "성공" : "실패");

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.container, { width: modalWidth }]}>
          <Text style={[styles.title, { fontSize: width * 0.05 }]}>
            {modalTitle}
          </Text>
          <Text style={[styles.subtitle, { fontSize: width * 0.035 }]}>
            {message}
          </Text>
          <View style={styles.iconWrapper}>
            {type === "success" ? (
              <ModalSuccessIcon
                width={modalWidth * 0.8}
                height={modalWidth * 0.5}
              />
            ) : (
              <ModalFailIcon
                width={modalWidth * 0.5}
                height={modalWidth * 0.5}
              />
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: COLORS.secondaryEater, height: height * 0.05 },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { fontSize: width * 0.04 }]}>
              확인
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.text,
    marginBottom: 16,
    textAlign: "center",
  },
  iconWrapper: {
    marginBottom: 20,
  },
  button: {
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
