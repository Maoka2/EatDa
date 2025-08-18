import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import SearchBar from "../../components/SearchBar";

import { useAuth } from "../../contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "StoreScreen"
>;

interface Store {
  storeId: number;
  storeName: string;
  latitude: number;
  longitude: number;
  distance: number;
}

interface NearbyStoresResponse {
  code: string;
  message: string;
  status: number;
  data: {
    stores: Array<{
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      distance: number;
    }>;
    totalCount: number;
    searchRadius: number;
    searchLocation: {
      latitude: number;
      longitude: number;
    };
    stationInfo?: {
      latitude: number;
      longitude: number;
      name?: string;
    };
  };
  timestamp: string;
}

interface LocationType {
  latitude: number;
  longitude: number;
}

const INITIAL_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
};

export default function StoreClusteringScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userRole } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [stationLocation, setStationLocation] = useState<LocationType | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(300);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

  const convertUserRole = (role: string | null | undefined): "eater" | "maker" => {
    if (role === "EATER") return "eater";
    if (role === "MAKER") return "maker";
    return "eater";
  };

  // 거리 계산 함수
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log("🔍 현재 위치 권한 상태:", currentStatus);

      if (currentStatus === "granted") {
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("📍 위치 권한 요청 결과:", status);
      return status === "granted";
    } catch (error) {
      console.error("위치 권한 요청 중 오류:", error);
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    try {
      console.log("🔍 사용자 위치 가져오기 시작...");

      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log("📡 GPS 서비스 활성화:", isEnabled);

      if (!isEnabled) {
        throw new Error("GPS 서비스가 비활성화되어 있습니다.");
      }

      const maxAttempts = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`📍 위치 가져오기 시도 ${attempt}/${maxAttempts}`);

          const location = await Location.getCurrentPositionAsync({
            accuracy: attempt === 1 ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval: 15000 + attempt * 5000,
            distanceInterval: 1,
          });

          console.log("✅ 위치 가져오기 성공:", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toLocaleString(),
          });

          const { latitude, longitude } = location.coords;
          if (latitude >= 33 && latitude <= 39 && longitude >= 124 && longitude <= 132) {
            console.log("🇰🇷 한국 내 위치 확인됨");
          } else {
            console.log("🌍 한국 외 위치:", latitude, longitude);
          }

          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        } catch (attemptError) {
          console.error(`❌ 시도 ${attempt} 실패:`, attemptError);
          lastError = attemptError as Error;

          if (attempt < maxAttempts) {
            console.log("⏳ 2초 후 다시 시도...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      throw lastError || new Error("모든 위치 가져오기 시도 실패");
    } catch (error) {
      console.error("❌ 위치 가져오기 최종 실패:", error);
      throw error;
    }
  };

  const fetchNearbyStores = async (lat: number, lng: number, distance: number) => {
    try {
      console.log("=== API 호출 시작 ===");

      const accessToken = await AsyncStorage.getItem("accessToken");
      console.log("토큰 확인:", accessToken ? "있음" : "없음");

      if (!accessToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        return;
      }

      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        distance: distance.toString(),
      });

      const apiUrl = `${API_BASE_URL}/api/stores/nearby?${params.toString()}`;
      console.log("요청 URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("응답 상태:", response.status);

      const responseText = await response.text();
      console.log("응답 본문:", responseText);

      if (!response.ok) {
        if (response.status === 400) {
          try {
            const errorData = JSON.parse(responseText);
            Alert.alert("요청 오류", errorData.message || "잘못된 요청입니다.");
          } catch (e) {
            Alert.alert("요청 오류", "잘못된 요청입니다.");
          }
          return;
        }

        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          await AsyncStorage.removeItem("accessToken");
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NearbyStoresResponse = JSON.parse(responseText);
      console.log("성공 응답 데이터:", data);

      if (data.status === 200) {
        let convertedStores: Store[] = data.data.stores.map((store) => ({
          storeId: store.id,
          storeName: store.name?.replace(/\s{2,}/g, " ").trim(),
          latitude: store.latitude,
          longitude: store.longitude,
          distance: store.distance,
        }));

        const baseLocation = data.data.searchLocation;
        if (baseLocation) {
          convertedStores = convertedStores.filter(store => {
            const actualDistance = calculateDistance(
              baseLocation.latitude,
              baseLocation.longitude,
              store.latitude,
              store.longitude
            );
            console.log(`🏪 ${store.storeName}: 계산된 거리 ${Math.round(actualDistance)}m vs 요청 거리 ${distance}m`);
            return actualDistance <= distance + 50;
          });
        }

        console.log("필터링된 가게 데이터:", convertedStores.length, "개");
        setStores(convertedStores);

        console.log("🔍 전체 data.data:", data.data);
        console.log("🚉 백엔드에서 POI로 변환된 역 위치:", data.data.searchLocation);

        if (data.data.searchLocation) {
          console.log("🚉 POI 역 위도:", data.data.searchLocation.latitude);
          console.log("🚉 POI 역 경도:", data.data.searchLocation.longitude);
          setStationLocation({
            latitude: data.data.searchLocation.latitude,
            longitude: data.data.searchLocation.longitude,
          });

          // 지도 중심을 POI 역 위치로 이동
          const newRegion = {
            latitude: data.data.searchLocation.latitude,
            longitude: data.data.searchLocation.longitude,
            latitudeDelta: getLatitudeDelta(distance),
            longitudeDelta: getLongitudeDelta(distance),
          };
          setMapRegion(newRegion);

          // 지도 애니메이션으로 이동
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        } else {
          console.log("❌ 백엔드에서 searchLocation을 주지 않음");
          setStationLocation(null);
          
          // 사용자 위치로 지도 중심 설정
          const newRegion = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: getLatitudeDelta(distance),
            longitudeDelta: getLongitudeDelta(distance),
          };
          setMapRegion(newRegion);

          // 지도 애니메이션으로 이동
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        }
      } else {
        Alert.alert("오류", data.message || "가게 정보를 불러오는데 실패했습니다.");
      }
    } catch (error: any) {
      console.error("API 호출 실패:", error);
      Alert.alert("오류", `네트워크 오류: ${error.message}`);
    }
  };

  // 거리에 따른 적절한 델타 값 계산
  const getLatitudeDelta = (distance: number) => {
    if (distance <= 300) return 0.008;
    if (distance <= 500) return 0.012;
    if (distance <= 1000) return 0.02;
    return 0.03;
  };

  const getLongitudeDelta = (distance: number) => {
    if (distance <= 300) return 0.008;
    if (distance <= 500) return 0.012;
    if (distance <= 1000) return 0.02;
    return 0.03;
  };

  useEffect(() => {
    const initializeLocation = async () => {
      console.log("🚀 위치 초기화 시작...");
      setLoading(true);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log("❌ 위치 권한 없음 - 기본 위치 사용");
        Alert.alert(
          "위치 권한 필요",
          "정확한 근처 가게 검색을 위해 위치 권한이 필요합니다. 권한을 허용하지 않으면 서울시청 기준으로 검색됩니다.",
          [
            {
              text: "확인",
              onPress: () => {
                const defaultLocation = { ...INITIAL_REGION };
                setCurrentLocation(defaultLocation);
                setMapRegion({
                  ...INITIAL_REGION,
                  latitudeDelta: getLatitudeDelta(selectedDistance),
                  longitudeDelta: getLongitudeDelta(selectedDistance),
                });
                fetchNearbyStores(
                  INITIAL_REGION.latitude,
                  INITIAL_REGION.longitude,
                  selectedDistance
                );
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      try {
        console.log("✅ 위치 권한 확인 완료 - 실제 위치 가져오기 시도");
        const location = await getCurrentLocation();
        console.log("🎯 최종 사용자 위치 설정:", location);

        setCurrentLocation(location);
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: getLatitudeDelta(selectedDistance),
          longitudeDelta: getLongitudeDelta(selectedDistance),
        });
        await fetchNearbyStores(location.latitude, location.longitude, selectedDistance);
      } catch (error) {
        console.error("❌ 위치 초기화 최종 실패:", error);
        console.log("🔄 기본 위치(서울시청)로 대체");

        Alert.alert(
          "위치 가져오기 실패",
          "현재 위치를 가져올 수 없어서 서울시청 기준으로 검색합니다. GPS가 켜져있는지 확인해주세요.",
          [
            {
              text: "확인",
              onPress: () => {
                const defaultLocation = { ...INITIAL_REGION };
                setCurrentLocation(defaultLocation);
                setMapRegion({
                  ...INITIAL_REGION,
                  latitudeDelta: getLatitudeDelta(selectedDistance),
                  longitudeDelta: getLongitudeDelta(selectedDistance),
                });
                fetchNearbyStores(
                  INITIAL_REGION.latitude,
                  INITIAL_REGION.longitude,
                  selectedDistance
                );
              },
            },
          ]
        );
      }

      setLoading(false);
    };

    initializeLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyStores(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedDistance
      );
    }
  }, [selectedDistance]);

  const handleDistanceChange = (distance: number) => {
    setSelectedDistance(distance);
  };

  const closeStoreInfo = () => {
    setSelectedStore(null);
  };

  const navigateToStore = (storeId: number) => {
    navigation.navigate("StoreScreen" as any, { storeId });
  };

  const handleMypage = () => {
    console.log("마이페이지로 이동");
  };

  const handleMarkerPress = (store: Store) => {
    console.log("🏪 마커 클릭된 가게:", store);
    setSelectedStore(store);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc6fae" />
          <Text style={styles.loadingText}>위치를 찾고 있습니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole={convertUserRole(userRole)}
          onMypage={handleMypage}
        />
        <HeaderLogo />
      </View>

      <SearchBar
        showTypeDropdown={showTypeDropdown}
        setShowTypeDropdown={setShowTypeDropdown}
        showDistanceDropdown={showDistanceDropdown}
        setShowDistanceDropdown={setShowDistanceDropdown}
        onDistanceChange={handleDistanceChange}
        selectedDistance={selectedDistance}
      />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
          onPress={() => setSelectedStore(null)}
        >
          {/* 사용자 위치 또는 POI 역 위치 마커 (핑크색) */}
          {(stationLocation || currentLocation) && (
            <Marker
              coordinate={{
                latitude: stationLocation?.latitude || currentLocation!.latitude,
                longitude: stationLocation?.longitude || currentLocation!.longitude,
              }}
              title={stationLocation ? "검색 기준 위치" : "현재 위치"}
              description="기준점"
              pinColor="#fc6fae"
            />
          )}

          {/* 반경 원 */}
          {(stationLocation || currentLocation) && (
            <Circle
              center={{
                latitude: stationLocation?.latitude || currentLocation!.latitude,
                longitude: stationLocation?.longitude || currentLocation!.longitude,
              }}
              radius={selectedDistance}
              fillColor="rgba(252, 111, 174, 0.15)"
              strokeColor="rgba(252, 111, 174, 0.3)"
              strokeWidth={1}
            />
          )}

          {/* 가게 마커들 (노란색) */}
          {stores.map((store) => (
            <Marker
              key={store.storeId}
              coordinate={{
                latitude: store.latitude,
                longitude: store.longitude,
              }}
              title={store.storeName}
              description={`${store.distance}m`}
              pinColor="#fcc566"
              onPress={() => handleMarkerPress(store)}
            />
          ))}
        </MapView>
      </View>

      {selectedStore && (
        <View style={styles.storeInfoCard}>
          <View style={styles.storeInfoHeader}>
            <Text style={styles.storeInfoTitle}>{selectedStore.storeName}</Text>
            <TouchableOpacity onPress={closeStoreInfo} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.storeInfoDistance}>
            현재 위치에서 {selectedStore.distance}m
          </Text>
          <TouchableOpacity
            style={styles.viewStoreButton}
            onPress={() => navigateToStore(selectedStore.storeId)}
          >
            <Text style={styles.viewStoreButtonText}>가게 보기</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  },
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  storeInfoCard: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  storeInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "500",
  },
  storeInfoDistance: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  viewStoreButton: {
    backgroundColor: "#fcc566",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#fcc566",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  viewStoreButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});