import React from "react";
import { Modal, View, SafeAreaView, StyleSheet } from "react-native";

interface ModalOverlayProps {
  visible: boolean;
  children: React.ReactNode;
  onRequestClose?: () => void;
}

export default function ModalOverlay({
  visible,
  children,
  onRequestClose,
}: ModalOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.container}>{children}</SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
  },
});
