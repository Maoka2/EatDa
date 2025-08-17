// src/screens/Store/DetailEventScreen.tsx
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
  Alert,
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

  // 상세가 언마운트되기 전에 삭제 완료 모달을 먼저 띄우기 위해 id를 보관
  const [deletedId, setDeletedId] = useState<string | null>(null);

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

  const doDelete = async () => {
    try {
      setDeleting(true);
      await deleteEvent(Number(event.id), storeId);
      // 부모 리스트 즉시 갱신하지 말고(언마운트 방지) 모달 먼저 띄움
      setDeletedId(event.id);
      setModalType("success");
      setModalTitle("삭제 완료");
      setModalMessage("이벤트가 성공적으로 삭제되었습니다.");
      setModalVisible(true);
    } catch (e: any) {
      setModalType("failure");
      setModalTitle("삭제 실패");
      setModalMessage(e?.message ?? "삭제 중 오류가 발생했습니다.");
      setModalVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  // 삭제 버튼 → Alert로 확인 후 실행
  const onPressDelete = () => {
    if (deleting) return;
    Alert.alert(
      "이벤트 삭제",
      "정말 삭제하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: doDelete },
      ],
      { cancelable: true }
    );
  };

  // 안전 이미지 소스
  const imageSource =
    typeof (event as any)?.uri === "number"
      ? (event as any).uri
      : (event as any).uri?.uri
      ? (event as any).uri
      : undefined;

  // ResultModal 닫기: 성공이면 여기서 부모에 반영하고 상세 닫기
  const handleResultClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      if (deletedId) {
        onDeleted?.(deletedId);
        setDeletedId(null);
      }
      onClose();
    }
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <View style={styles.eventDetailContainer}>
        {/* 닫기 */}
        <View style={{paddingVertical:30,}}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <CloseBtn></CloseBtn>
          </TouchableOpacity>
        </View>

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
            ></Image>
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
                <ActivityIndicator color="#fff"></ActivityIndicator>
              ) : (
                <Text style={styles.deleteText}>이벤트 삭제하기</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ✅ ResultModal로 성공/실패 안내 */}
      <ResultModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleResultClose}
      ></ResultModal>
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
  
  ImageContainer: { alignItems: "center" },
  eventImage: { borderRadius: 12 } as any,
  eventTextContainer: {
    marginTop: 30,
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
