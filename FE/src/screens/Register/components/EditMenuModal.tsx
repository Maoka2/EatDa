// src/screens/Register/components/EditMenuModal.tsx
import React from "react";
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image,
  TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, useWindowDimensions
} from "react-native";
import { COLORS } from "../../../constants/theme";
import { MenuItemType } from "../types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  menuItem: MenuItemType | undefined;
  onUpdate: (field: keyof MenuItemType, value: string) => void;
  onRemove: () => void;
  onPickImage: () => void;
};

export default function EditMenuModal({
  visible, onClose, onSave, menuItem, onUpdate, onRemove, onPickImage,
}: Props) {
  const { width, height } = useWindowDimensions();
  if (!menuItem) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.modalCancel, { fontSize: width * 0.04 }]}>취소</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: width * 0.045 }]}>메뉴 수정</Text>
              <TouchableOpacity onPress={onSave}>
                <Text style={[styles.modalSave, { fontSize: width * 0.04, color: COLORS.secondaryMaker }]}>저장</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* 이미지 */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { fontSize: width * 0.04 }]}>메뉴 이미지</Text>
                <TouchableOpacity
                  style={[styles.imagePickerButton, { height: height * 0.15, marginBottom: height * 0.02 }]}
                  onPress={onPickImage}
                >
                  {menuItem.imageUri ? (
                    <Image source={{ uri: menuItem.imageUri }} style={{ width: "100%", height: "100%", borderRadius: 10 }} resizeMode="cover" />
                  ) : (
                    <>
                      <Text style={[styles.imagePickerIcon, { fontSize: width * 0.08 }]}>📷</Text>
                      <Text style={[styles.imagePickerText, { fontSize: width * 0.035 }]}>이미지 추가</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* 이름 */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { fontSize: width * 0.04 }]}>메뉴 이름</Text>
                <TextInput
                  style={[styles.modalInput, { fontSize: width * 0.04 }]}
                  value={menuItem.name}
                  onChangeText={(t) => onUpdate("name", t)}
                  placeholder="메뉴 이름을 입력하세요"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* 가격 */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { fontSize: width * 0.04 }]}>가격</Text>
                <TextInput
                  style={[styles.modalInput, { fontSize: width * 0.04 }]}
                  value={menuItem.price}
                  onChangeText={(t) => onUpdate("price", t)}
                  placeholder="가격을 입력하세요"
                  keyboardType="numeric"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* 설명 */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { fontSize: width * 0.04 }]}>메뉴 설명</Text>
                <TextInput
                  style={[styles.modalDescriptionInput, { fontSize: width * 0.04 }]}
                  value={menuItem.description}
                  onChangeText={(t) => onUpdate("description", t)}
                  placeholder="메뉴 설명을 입력하세요"
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              {/* 삭제 */}
              <TouchableOpacity style={styles.modalDeleteMenuButton} onPress={onRemove}>
                <Text style={[styles.modalDeleteMenuText, { fontSize: width * 0.04 }]}>이 메뉴 삭제하기</Text>
              </TouchableOpacity>

              <View style={{ height: height * 0.1 }} />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#E5E5E5",
  },
  modalCancel: { color: "#999" },
  modalTitle: { fontWeight: "600", color: COLORS.text },
  modalSave: { fontWeight: "600" },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  modalSection: { marginTop: 20 },
  modalSectionTitle: { fontWeight: "600", color: COLORS.text, marginBottom: 10 },
  imagePickerButton: {
    backgroundColor: "#F5F5F5", borderRadius: 10, justifyContent: "center",
    alignItems: "center", borderWidth: 1, borderColor: "#E5E5E5",
  },
  imagePickerIcon: { marginBottom: 5 },
  imagePickerText: { color: "#999" },
  modalInput: {
    borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFF",
  },
  modalDescriptionInput: {
    borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFF", minHeight: 80,
  },
  modalDeleteMenuButton: {
    width: "100%", paddingVertical: 12, borderRadius: 8, backgroundColor: "#FF4444", alignItems: "center", marginTop: 10,
  },
  modalDeleteMenuText: { color: "#FFF", fontWeight: "600" },
});
