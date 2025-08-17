// src/screens/EventMaking/EventGenerateStep.tsx
import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import ImageUploader from "../../components/ImageUploader";

type MarkedDates = {
  [date: string]: {
    startingDay?: boolean;
    endingDay?: boolean;
    color: string;
    textColor?: string;
  };
};

interface EventGenProps {
  eventName: string;
  uploadedImages: string[];
  startDate: string | null;
  endDate: string | null;
  prompt: string;
  onEventName: (name: string) => void;
  onAdd: (imageUrl: string) => void;
  onRemove: (i: number) => void;
  onDateSelect: (start: string | null, end: string | null) => void;
  onPrompt: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function GenerateStep({
  eventName,
  uploadedImages,
  startDate,
  endDate,
  prompt,
  onEventName,
  onAdd,
  onRemove,
  onDateSelect,
  onPrompt,
  onNext,
  onBack,
}: EventGenProps) {
  const { width } = useWindowDimensions();
  const [localImages, setLocalImages] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [markedDate, setMarkedDate] = useState<MarkedDates>({});

  useEffect(() => {
    const newImages: (string | null)[] = [null, null, null];
    uploadedImages.forEach((img, index) => {
      if (index < 3) {
        newImages[index] = img;
      }
    });
    setLocalImages(newImages);
  }, [uploadedImages]);

  const handleAddImage = (index: number, imageUrl: string) => {
    const newImages = [...localImages];
    newImages[index] = imageUrl;
    setLocalImages(newImages);
    if (onAdd) onAdd(imageUrl);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...localImages];
    newImages[index] = null;
    setLocalImages(newImages);
    if (onRemove) onRemove(index);
  };

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    let current = new Date(start);
    const endDt = new Date(end);

    while (current <= endDt) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const onDayPress = (day: { dateString: string }) => {
    // 시작일 재설정
    if (!startDate || (startDate && endDate)) {
      onDateSelect(day.dateString, null);
      setMarkedDate({
        [day.dateString]: {
          startingDay: true,
          endingDay: true,
          color: "#fec566",
          textColor: "#fff",
        },
      });
    } else {
      const start = new Date(startDate);
      const end = new Date(day.dateString);

      // 종료일이 시작일보다 빠르면 다시 시작일로 설정
      if (start > end) {
        onDateSelect(day.dateString, null);
        setMarkedDate({
          [day.dateString]: {
            startingDay: true,
            endingDay: true,
            color: "#fec566",
            textColor: "#fff",
          },
        });
        return;
      }

      // 이벤트 기간 마킹
      const range = getDatesInRange(startDate, day.dateString);
      const marks: MarkedDates = {};
      range.forEach((date, index) => {
        marks[date] = {
          color: "#fec566",
          textColor: "#fff",
          startingDay: index === 0,
          endingDay: index === range.length - 1,
        };
      });

      onDateSelect(startDate, day.dateString);
      setMarkedDate(marks);
    }
  };

  const hasImages = localImages.some((img) => img !== null);
  const hasEventPeriod = startDate !== null;
  const isDisabled =
    !eventName.trim() || !hasImages || !hasEventPeriod || !prompt.trim();

  const placeholderText = `1. 한글 텍스트가 깨질 수 있어요
일부 AI 모델은 한글을 완벽하게 인식하지 못해 텍스트가 이미지에 올바르게 출력되지 않을 수 있습니다.

2. 구체적으로 작성할수록 좋아요
원하는 이미지가 있다면, 색상, 분위기, 배치, 텍스트 위치 등을 최대한 자세히 설명해 주세요.
예) "화려한 색상과 큰 할인율이 돋보이는 세일 포스터를 만들어줘. 중앙에 큰 글씨로 할인율을 배치하고 주변에 상품 이미지들을 넣어줘"

3. 다양한 버전의 이벤트 포스터를 생성해보세요
마음에 들 때까지 자유롭게 이벤트 포스터를 생성할 수 있습니다.
가장 마음에 드는 버전이 나올 때까지 편하게 이용하세요!`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "android" ? "height" : "padding"}
      keyboardVerticalOffset={0}
    >
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={width * 0.06} color="#1A1A1A" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>이벤트 포스터 생성</Text>
          <Text style={styles.subtitle}>
            생성할 이벤트 포스터의 데이터를 입력해주세요
          </Text>
        </View>

        {/* 이벤트 이름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이벤트 이름</Text>
          <TextInput
            style={styles.eventNameInput}
            placeholder="이벤트 이름을 입력해주세요."
            placeholderTextColor="#999999"
            value={eventName}
            onChangeText={onEventName}
          />
        </View>

        {/* 이미지 첨부 */}
        <View style={styles.upSec}>
          <Text style={styles.sectionTitle}>참고할 이미지를 첨부해주세요</Text>
          <ImageUploader
            images={localImages}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            maxImages={3}
            accentColor="#fec566"
          />
        </View>

        {/* 이벤트 기간 설정 */}
        <View style={styles.calendarSec}>
          <Text style={styles.sectionTitle}>이벤트 기간 설정</Text>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDate}
            markingType={"period"}
            theme={{
              selectedDayBackgroundColor: "#fec566",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#fec566",
              arrowColor: "#fec566",
            }}
          />
        </View>

        {/* 포스터 디자인 프롬프트 */}
        <View style={styles.promptSec}>
          <Text style={styles.sectionTitle}>
            생성할 포스터의 디자인을 구체적으로 작성해주세요
          </Text>
          <TextInput
            style={styles.promptInput}
            multiline
            placeholder={placeholderText}
            placeholderTextColor="#999999"
            textAlignVertical="top"
            value={prompt}
            onChangeText={onPrompt}
            scrollEnabled={true}
            numberOfLines={10}
          />
        </View>
      </ScrollView>

      {/* 확인 버튼 */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={isDisabled ? () => {} : onNext}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#F7F8F9",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#F7F8F9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
  },
  eventNameInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
    fontSize: 14,
  },
  upSec: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#F7F8F9",
    marginBottom: 12,
  },
  calendarSec: {
    backgroundColor: "#F7F8F9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
  },
  promptSec: {
    backgroundColor: "#F7F8F9",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 120,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    height: 250,
    padding: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
    fontSize: 12,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#F7F8F9",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
    backgroundColor: "#fec566",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
