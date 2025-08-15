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
  Alert,
  ActivityIndicator,
} from "react-native";
import { eventItem } from "../../components/GridComponent";
import CloseBtn from "../../../assets/closeBtn.svg";
import { deleteEvent } from "../EventMaking/services/api"; // ⬅️ 추가

interface DetailEventScreenProps {
  events: eventItem[];
  selectedIndex: number;
  onClose: () => void;
  onDeleted?: (deletedId: string) => void; // ⬅️ 부모가 목록에서 제거하려면 옵셔널 콜백
}

export default function ({
  events,
  selectedIndex,
  onClose,
  onDeleted,
}: DetailEventScreenProps) {
  const { width, height } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const event = events[selectedIndex];

  const confirmDelete = () => {
    Alert.alert("이벤트 삭제", "정말 삭제하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteEvent(Number(event.id));
            onDeleted?.(event.id); // ⬅️ 부모 목록에서 제거
            onClose(); // ⬅️ 상세 닫기
          } catch (e: any) {
            Alert.alert(
              "삭제 실패",
              e?.message ?? "삭제 중 오류가 발생했습니다."
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
      <View style={styles.eventDetailContainer}>
        {/* 닫기 */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          disabled={deleting}
        >
          <CloseBtn />
        </TouchableOpacity>

        <Text style={styles.storeName}>{event.storeName}</Text>

        <View style={styles.ImageContainer}>
          <Image
            source={{ uri: event.uri }}
            style={[
              styles.eventImage,
              { width: width * 0.8, height: height * 0.4 },
            ]}
            resizeMode="cover"
          />
        </View>

        <View style={styles.eventTextContainer}>
          <Text style={styles.eventTitle}>{event.eventName}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>

        <View style={styles.deleteWrapper}>
          <TouchableOpacity
            style={[styles.deleteContainer, deleting && { opacity: 0.6 }]}
            onPress={confirmDelete}
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
      </View>
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
  eventDescription: { fontSize: 14 } as any,
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
