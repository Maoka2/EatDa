import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
  Modal,
} from "react-native";
import { eventItem } from "../../components/GridComponent";
import CloseBtn from "../../../assets/closeBtn.svg";
import { deleteEvent } from "../EventMaking/services/api";
import ResultModal from "../../components/ResultModal";

interface DetailEventScreenProps {
  events: eventItem[];
  selectedIndex: number;
  onClose: () => void;
  onDeleted?: (deletedId: string) => void;
  /** 가게 주인일 때만 true → 삭제 버튼 노출 */
  canDelete?: boolean;
  /** (선택) 서버가 스토어 스코프를 요구할 때 404 리트라이 용 */
  storeId?: number;
}

function ConfirmModal({
  visible,
  title = "확인",
  message,
  confirmText = "삭제",
  cancelText = "취소",
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <Text style={cm.title}>{title}</Text>
          <Text style={cm.msg}>{message}</Text>
          <View style={cm.row}>
            <TouchableOpacity
              style={[cm.btn, cm.ghost]}
              onPress={busy ? undefined : onCancel}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text style={[cm.btnText, cm.ghostText]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.btn, cm.danger, busy && { opacity: 0.7 }]}
              onPress={busy ? undefined : onConfirm}
              disabled={busy}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={cm.btnText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DetailEventScreen({
  events,
  selectedIndex,
  onClose,
  onDeleted,
  canDelete = false,
  storeId,
}: DetailEventScreenProps) {
  const { width, height } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [deleting, setDeleting] = useState(false);

  // ResultModal 상태 (성공/실패)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("failure");
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalMessage, setModalMessage] = useState("");

  // 삭제 확인 모달
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  // 안전 가드
  const event = events[selectedIndex];

  if (!event) {
    return (
      <View
        style={[
          styles.eventDetailContainer,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text>이벤트 정보를 불러오지 못했습니다.</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
          <Text style={{ color: "#6c5ce7" }}>닫기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openError = (msg: string) => {
    setModalType("failure");
    setModalTitle("삭제 실패");
    setModalMessage(msg);
    setModalVisible(true);
  };

  const openSuccess = (msg: string) => {
    setModalType("success");
    setModalTitle("삭제 완료");
    setModalMessage(msg);
    setModalVisible(true);
  };

  const onPressDelete = () => setConfirmVisible(true);

  const doDelete = async () => {
    try {
      setDeleting(true);
      await deleteEvent(Number(event.id), storeId); // storeId는 선택 전달
      // 목록에서 제거(부모가 리스트 갱신)
      onDeleted?.(event.id);
      setConfirmVisible(false);
      // ✅ 성공 모달
      openSuccess("이벤트가 성공적으로 삭제되었습니다.");
    } catch (e: any) {
      setConfirmVisible(false);
      openError(e?.message ?? "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 안전 이미지 소스
  const imageSource =
    typeof (event as any)?.uri === "number"
      ? (event as any).uri
      : (event as any).uri?.uri
      ? (event as any).uri
      : undefined;

  // ResultModal 닫기: 성공이면 상세도 닫기
  const handleResultClose = () => {
    setModalVisible(false);
    if (modalType === "success") onClose();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <View style={styles.eventDetailContainer}>
        {/* 닫기 */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          disabled={deleting}
          activeOpacity={0.8}
        >
          <CloseBtn />
        </TouchableOpacity>

        {/* 상단 가게명 */}
        {!!event.storeName && (
          <Text style={styles.storeName}>{event.storeName}</Text>
        )}

        {/* 이미지 */}
        <View style={styles.ImageContainer}>
          {imageSource ? (
            <Image
              source={imageSource as any}
              style={[
                styles.eventImage,
                { width: width * 0.8, height: height * 0.4 },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.eventImage,
                {
                  width: width * 0.8,
                  height: height * 0.4,
                  backgroundColor: "#eee",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ color: "#999" }}>이미지가 없습니다</Text>
            </View>
          )}
        </View>

        {/* 텍스트 */}
        <View style={styles.eventTextContainer}>
          <Text style={styles.eventTitle}>{event.eventName}</Text>
          {!!event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
        </View>

        {/* 삭제 버튼: 가게 주인만 노출 */}
        {canDelete && (
          <View style={styles.deleteWrapper}>
            <TouchableOpacity
              style={[styles.deleteContainer, deleting && { opacity: 0.6 }]}
              onPress={onPressDelete}
              disabled={deleting}
              activeOpacity={0.8}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteText}>이벤트 삭제하기</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        visible={confirmVisible}
        title="이벤트 삭제"
        message="정말 삭제하시겠어요?"
        confirmText="삭제"
        cancelText="취소"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* ✅ ResultModal로 성공/실패 안내 */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleResultClose}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  eventDetailContainer: { flex: 1, backgroundColor: "#F7F8F9" } as any,
  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingRight: 15,
    zIndex: 5,
  },
  storeName: {
    fontWeight: "500",
    textAlign: "center",
    fontSize: 20,
    paddingVertical: 15,
  } as any,
  ImageContainer: { alignItems: "center" },
  eventImage: { borderRadius: 12 } as any,
  eventTextContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#F7F8F9",
  } as any,
  eventTitle: { fontSize: 18, paddingBottom: 10 } as any,
  eventDescription: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
  } as any,
  deleteWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  deleteContainer: {
    backgroundColor: "#fec566",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    alignItems: "center",
  },
});

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  msg: { fontSize: 14, color: "#374151", marginTop: 8, lineHeight: 20 },
  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  danger: { backgroundColor: "#ef4444" },
  ghost: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ghostText: { color: "#374151" },
});
