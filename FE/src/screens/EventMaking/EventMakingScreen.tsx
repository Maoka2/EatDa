import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
  ScrollView,
  TextInput,
} from "react-native";
// 캘린더용 설치 필요
// npm install react-native-calendars
// npm install dayjs
import { Calendar } from "react-native-calendars";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import { SHADOWS } from "../../constants/theme";

export default function EventMakingScreen() {
  // interface EventProps{
  //     id:
  //     store_id:
  //     title:
  //     description:
  //     start_at:
  //     end_at:
  //     created_at?:
  //     updated_at?:
  // }

  const { width, height } = useWindowDimensions();
  const horizonMargin = width * 0.04;

  const guidePlaceHolder = [
    "1. 한글 텍스트가 깨질 수 있어요",
    "일부 AI 모델은 한글을 완벽하게 인식하지 못해",
    "텍스트가 이미지에 올바르게 출력되지 않을 수 있습니다.",

    "",
    "2. 구체적으로 작성할수록 좋아요",
    "원하는 이미지가 있다면, 색상, 분위기, 배치, 텍스트 위치 등을",
    "최대한 자세히 설명해 주세요.",
    "예: 20대 남성이 집에서 음식을 맛있게 먹고,",
    "활짝 웃으면서 행복해하는 모습을 친구가 찍어준 구도",
    "(음식과 남성이 다 보이는)로 이미지를 생성해줘",

    "",
    "3. 다양한 버전의 이벤트 포스터를 생성해보세요",
    "마음에 들 때까지 자유롭게 이벤트 포스터를 생성할 수 있습니다.",
    "가장 마음에 드는 버전이 나올 때까지 편하게 이용하세요!",
  ].join("\n");

  // 캘린더용
  type MarkedDates = {
    [date: string]: {
      startingDay?: boolean;
      endingDay?: boolean;
      color: string;
      textColor?: string;
    };
  };
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [markedDate, setMarkedDate] = useState<MarkedDates>({});

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
    if (!startDate || (startDate && endDate)) {
      // 시작일 재설정
      setStartDate(day.dateString);
      setEndDate(null);
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

      if (start > end) {
        // 종료일이 시작일보다 빠르면 다시 시작일로 설정
        setStartDate(day.dateString);
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

      // 범위 마킹
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

      setEndDate(day.dateString);
      setMarkedDate(marks);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole="maker"
          onLogout={() => console.log("logout")}
          activePage="eventMaking"
        ></HamburgerButton>

        <HeaderLogo></HeaderLogo>
      </View>

      {/* 가게정보 파트 */}
      <View style={styles.storeInfo}>
        {/* 가게명 */}
        <Text style={styles.storeName}>햄찌네 피자</Text>
        {/* <Text style={styles.storeName}>{storeName}</Text> */}
        {/* 가게 주소 */}
        <Text style={styles.storeAddress}>
          📍서울특별시 강남구 테헤란로 212
        </Text>
        {/* <Text style={styles.storeAddress}>{storeAddress}</Text> */}
      </View>

      <ScrollView style={{ backgroundColor: "#f7f8f9" }}>
        {/* 이벤트 이름 설정 */}
        <Text
          style={[
            styles.inScrollViewText,
            {
              paddingTop: width * 0.02,
              paddingBottom: height * 0.015,
              marginHorizontal: horizonMargin,
            },
          ]}
        >
          이벤트 이름
        </Text>
        <View
          style={[
            styles.placeHolderWrapper,
            SHADOWS.small,
            { marginHorizontal: horizonMargin },
          ]}
        >
          <TextInput
            style={[{ paddingHorizontal: horizonMargin }, { fontSize: 12 }]}
            placeholder="이벤트 이름을 입력해주세요."
            placeholderTextColor="#b3b3b3"
          />
        </View>
        {/* 이미지 첨부 */}
        <Text
          style={[
            styles.inScrollViewText,
            { marginHorizontal: horizonMargin, marginVertical: height * 0.03 },
          ]}
        >
          참고할 이미지를 첨부해주세요
        </Text>
        <Text>컴포넌트 넣을 예정</Text>
        {/* 이벤트 기간 설정 */}
        <Text
          style={[
            styles.inScrollViewText,
            {
              marginHorizontal: horizonMargin,
              marginTop: height * 0.03,
              marginBottom: height * 0.035,
            },
          ]}
        >
          이벤트 기간 설정
        </Text>
        <Calendar
          onDayPress={onDayPress}
          markedDates={markedDate}
          markingType={"period"}
        ></Calendar>
        {/* 프롬프트 작성란 */}
        <Text
          style={[
            styles.inScrollViewText,
            { marginHorizontal: horizonMargin, marginVertical: height * 0.03 },
          ]}
        >
          생성할 포스터의 디자인을 구체적으로 작성해주세요
        </Text>
        <View
          style={[
            styles.placeHolderWrapper,
            SHADOWS.small,
            { marginHorizontal: horizonMargin, marginBottom: height * 0.029 },
          ]}
        >
          <TextInput
            style={[{ paddingHorizontal: horizonMargin }, { fontSize: 12 }]}
            placeholder={guidePlaceHolder}
            multiline
            scrollEnabled
            textAlignVertical="top"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        {/* 눌렀을 때 모달 창 뜨도록 */}
      </ScrollView>
      <View style={{ paddingBottom: height * 0.029 }}>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              marginHorizontal: horizonMargin,
              paddingVertical: height * 0.02,
            },
          ]}
        >
          <Text style={[styles.createButtonText]}>이벤트 생성하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  storeInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,

    marginVertical: 10,
  } as ViewStyle,

  storeName: {
    fontSize: 20,
    fontWeight: 500,
    marginRight: 12,
  } as TextStyle,

  storeAddress: {
    marginTop: 9,
    fontSize: 12,
    letterSpacing: -0.3,
  } as TextStyle,

  inScrollViewText: {
    fontSize: 15,
    color: "#333333",
  } as TextStyle,

  placeHolderWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
  },

  createButton: {
    backgroundColor: "#fec566",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  createButtonText: {
    color: "#f5f5f5",
    fontWeight: "bold",
  } as TextStyle,
});
