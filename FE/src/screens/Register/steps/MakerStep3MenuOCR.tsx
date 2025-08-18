import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../../constants/theme";
import { MenuItemType } from "../types";
import EditMenuModal from "../components/EditMenuModal";

type Props = {
  isScanning: boolean;
  isPolling: boolean;
  menuItems: MenuItemType[];
  onScan: () => void;

  editModalVisible: boolean;
  editingMenuId: string | null;
  onCloseEdit: () => void;
  onSaveEdit: () => void;
  onUpdateMenuItem: (
    id: string,
    field: keyof MenuItemType,
    value: string
  ) => void;
  onRemoveMenuItem: (id: string) => void;
  onAddMenuImage: (id: string) => void;
  onOpenEdit: (id: string) => void;
};

export default function MakerStep3MenuOCR({
  isScanning,
  isPolling,
  menuItems,
  onScan,
  editModalVisible,
  editingMenuId,
  onCloseEdit,
  onSaveEdit,
  onUpdateMenuItem,
  onRemoveMenuItem,
  onAddMenuImage,
  onOpenEdit,
}: Props) {
  const { width, height } = useWindowDimensions();
  const currentItem = menuItems.find((m) => m.id === editingMenuId);

  const renderScanContent = () => {
    if (isPolling) {
      return (
        <View style={styles.scanPlaceholder}>
          <ActivityIndicator size="large" color={COLORS.secondaryMaker} />
          <Text
            style={[styles.scanText, { fontSize: width * 0.04, marginTop: 10 }]}
          >
            메뉴판을 분석 중입니다...
          </Text>
          <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
            잠시만 기다려주세요
          </Text>
        </View>
      );
    }

    if (menuItems.length === 0) {
      return (
        <View style={styles.scanPlaceholder}>
          <Text style={styles.scanIcon}>{isScanning ? "⏳" : "📷"}</Text>
          <Text style={[styles.scanText, { fontSize: width * 0.04 }]}>
            {isScanning ? "메뉴판을 분석 중..." : "메뉴판을 촬영해주세요"}
          </Text>
          <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
            메뉴 이름과 가격을 자동으로 인식합니다
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.scanResult}>
        <Text style={styles.scanIcon}>✅</Text>
        <Text style={[styles.scanResultText, { fontSize: width * 0.04 }]}>
          {menuItems.length}개 메뉴를 찾았습니다
        </Text>
        <TouchableOpacity
          style={[
            styles.rescanButton,
            { backgroundColor: COLORS.secondaryMaker },
          ]}
          onPress={onScan}
          disabled={isScanning || isPolling}
        >
          <Text style={[styles.rescanText, { fontSize: width * 0.03 }]}>
            다시 스캔하기
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.desc, { fontSize: width * 0.035 }]}>
        카메라로 메뉴판을 찍어{"\n"}간편하게 메뉴를 등록해보세요
      </Text>

      <TouchableOpacity
        style={[
          styles.scanButton,
          { height: height * 0.25, marginBottom: height * 0.03 },
        ]}
        onPress={onScan}
        disabled={isScanning || isPolling}
      >
        {renderScanContent()}
      </TouchableOpacity>

      {menuItems.length > 0 && (
        <View style={styles.menuItemsContainer}>
          <View style={styles.menuHeaderRow}>
            <Text style={[styles.menuItemsTitle, { fontSize: width * 0.04 }]}>
              인식된 메뉴 목록
            </Text>
            <Text style={[styles.menuHelpText, { fontSize: width * 0.03 }]}>
              메뉴를 터치하여 수정할 수 있습니다
            </Text>
          </View>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemCard}
              onPress={() => onOpenEdit(item.id)}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuImageContainer,
                    { width: width * 0.15, height: width * 0.15 },
                  ]}
                >
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.menuImageWrapper}
                      resizeMode="cover"
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={() => onOpenEdit(item.id)}
                    >
                      <Text style={styles.addImageIcon}>📷</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.menuInfo}>
                  <Text style={[styles.menuName, { fontSize: width * 0.04 }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.menuPrice, { fontSize: width * 0.035 }]}>
                    {item.price}
                  </Text>
                  {!!item.description && (
                    <Text
                      style={[
                        styles.menuDescription,
                        { fontSize: width * 0.03 },
                      ]}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: COLORS.secondaryMaker },
                  ]}
                  onPress={() => onOpenEdit(item.id)}
                >
                  <Text
                    style={[styles.editButtonText, { fontSize: width * 0.03 }]}
                  >
                    수정
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          <View
            style={[styles.completionIndicator, { marginTop: height * 0.02 }]}
          >
            <View style={styles.completionDots}>
              {[...Array(3)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.completionDot,
                    {
                      backgroundColor:
                        i < 2 ? COLORS.secondaryMaker : COLORS.inactive,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      <EditMenuModal
        visible={editModalVisible}
        onClose={onCloseEdit}
        onSave={onSaveEdit}
        menuItem={currentItem}
        onUpdate={(field, value) =>
          currentItem && onUpdateMenuItem(currentItem.id, field, value)
        }
        onRemove={() => currentItem && onRemoveMenuItem(currentItem.id)}
        onPickImage={() => currentItem && onAddMenuImage(currentItem.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  desc: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  scanButton: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.inactive + "50",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  scanPlaceholder: { alignItems: "center" },
  scanIcon: { fontSize: 48, marginBottom: 10 },
  scanText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  scanSubText: { color: COLORS.inactive, textAlign: "center" },
  scanResult: { alignItems: "center" },
  scanResultText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  rescanButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rescanText: { color: "#FFF", fontWeight: "500" },

  menuItemsContainer: { marginBottom: 20 },
  menuHeaderRow: { marginBottom: 15 },
  menuItemsTitle: { fontWeight: "600", color: COLORS.text, marginBottom: 5 },
  menuHelpText: { color: COLORS.inactive },
  menuItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  menuImageContainer: {
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuImageWrapper: { width: "100%", height: "100%", borderRadius: 8 },
  addImageButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  addImageIcon: { fontSize: 20, color: COLORS.inactive },
  menuInfo: { flex: 1 },
  menuName: { fontWeight: "600", color: COLORS.text, marginBottom: 2 },
  menuPrice: {
    color: COLORS.secondaryMaker,
    fontWeight: "500",
    marginBottom: 4,
  },
  menuDescription: { color: COLORS.inactive, lineHeight: 16 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editButtonText: { color: "#FFF", fontWeight: "500" },

  completionIndicator: { alignItems: "center" },
  completionDots: { flexDirection: "row", gap: 4 },
  completionDot: { width: 6, height: 6, borderRadius: 3 },
});
