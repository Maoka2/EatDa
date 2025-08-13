// src/screens/EventMaking/ActiveEventScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  Animated,
  ActivityIndicator,
} from "react-native";

import { getActiveEvents, ActiveEvent } from "./services/api";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../contexts/AuthContext";
import { eventItem } from "../../components/GridComponent";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import GridComponent from "../../components/GridComponent";
import CloseButton from "../../../assets/closeBtn.svg";
import NoDataScreen from "../../components/NoDataScreen";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ActiveEventScreen"
>;

export default function ActiveEventScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();

  const handleMypage = () => {};
  const handleCreateEventPoster = () =>
    navigation.navigate("EventMakingScreen");

  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";

  const [selectedEvent, setSelectedEvent] = useState<eventItem | null>(null);
  const [items, setItems] = useState<eventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ★ 리뷰탭과 동일: 바깥 래퍼에서 width 측정 + 정수 타일
  const [containerWidth, setContainerWidth] = useState(0);
  const tile = Math.floor(containerWidth / 3);

  const adapt = (a: ActiveEvent): eventItem => ({
    id: String(a.eventId),
    eventName: a.title,
    eventDescription: a.title,
    uri: { uri: a.postUrl },
    start_date: new Date(a.startAt),
    end_date: new Date(a.endAt),
    storeName: a.storeName,
  });

  const fetchActive = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await getActiveEvents();
      setItems(list.map(adapt));
    } catch (e) {
      console.warn("getActiveEvents failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const list = await getActiveEvents();
          if (!cancelled) setItems(list.map(adapt));
        } catch (e) {
          console.warn("getActiveEvents failed", e);
          if (!cancelled) setItems([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchActive])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getActiveEvents();
      setItems(list.map(adapt));
    } catch (e) {
      console.warn("refresh getActiveEvents failed", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 상세 보기 애니메이션
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    if (selectedEvent) scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [selectedEvent]);

  // 상세 보기
  if (selectedEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          <CloseButton
            onPress={() => setSelectedEvent(null)}
            style={[
              { position: "absolute" },
              { top: height * 0.04, right: width * 0.07 },
            ]}
          />
          <View
            style={[
              styles.storeNameContainer,
              { paddingTop: height * 0.05, paddingBottom: height * 0.03 },
            ]}
          >
            <Text style={[styles.storeName, { paddingBottom: height * 0.05 }]}>
              {selectedEvent.storeName}
            </Text>
            <Image
              style={{
                width: width * 0.8,
                height: height * 0.65,
                borderRadius: 10,
              }}
              source={selectedEvent.uri}
              resizeMode="stretch"
            />
          </View>
          <View style={[styles.textOverLay, { marginHorizontal: width * 0.1 }]}>
            <Text
              style={[
                styles.eventName,
                { paddingBottom: height * 0.017, paddingTop: height * 0.02 },
              ]}
            >
              {selectedEvent.eventName}
            </Text>
            <Text
              style={[
                styles.eventDescription,
                { paddingBottom: height * 0.02 },
              ]}
            >
              {selectedEvent.eventDescription}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // 전체 보기 (★ 리뷰탭과 동일한 측정/여백 방식)
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={[styles.headerContainer, { paddingBottom: height * 0.02 }]}>
        <HamburgerButton
          userRole={isMaker ? "maker" : "eater"}
          onMypage={handleMypage}
        />
        <HeaderLogo />
      </View>

      {/* width 측정은 FlatList 바깥 래퍼에서 */}
      <View
        style={{ flex: 1, backgroundColor: "#fff" }}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          // 여백/패딩 0 → 리뷰탭과 동일
          style={{ margin: 0, padding: 0, backgroundColor: "#fff" }}
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <GridComponent
              item={item}
              size={tile} // 정수 타일
              index={index}
              totalLength={items.length}
              onPress={() => setSelectedEvent(item)}
            />
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingTop: 80, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#fec566" />
              </View>
            ) : (
              <NoDataScreen />
            )
          }
          contentInsetAdjustmentBehavior="never"
        />
      </View>

      {!selectedEvent && isMaker && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={handleCreateEventPoster}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.createEventButtonText}>
                이벤트 포스터 생성하기
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  } as ViewStyle,
  createEventButton: {
    backgroundColor: "#fec566",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  createEventButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  } as TextStyle,
  storeName: {
    color: "#333333",
    fontWeight: "bold",
    fontSize: 20,
  } as TextStyle,
  storeNameContainer: { alignItems: "center", justifyContent: "center" },
  textOverLay: {
    backgroundColor: "#EEEEEE",
    borderRadius: 10,
    alignItems: "center",
  } as ViewStyle,
  eventName: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  } as TextStyle,
  eventDescription: { color: "#333333", fontSize: 12 } as TextStyle,
});
