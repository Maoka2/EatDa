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
import { WebView } from "react-native-webview";
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

const KAKAO_API_KEY = Constants.expoConfig?.extra?.kakaoApiKey || "8e8f365a52aa8fbcee64e49c01552c71";

export default function StoreClusteringScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userRole } = useAuth();
  const webViewRef = useRef<WebView>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(300);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  const API_BASE_URL = "https://i13a609.p.ssafy.io/test";

  console.log("🔑 카카오 API 키:", KAKAO_API_KEY);

  const convertUserRole = (role: string | null | undefined): "eater" | "maker" => {
    if (role === "EATER") return "eater";
    if (role === "MAKER") return "maker";
    return "eater";
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      // 먼저 현재 권한 상태 확인
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log("🔍 현재 위치 권한 상태:", currentStatus);
      
      if (currentStatus === 'granted') {
        return true;
      }
      
      // 권한 요청
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
      
      // GPS 서비스 활성화 확인
      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log("📡 GPS 서비스 활성화:", isEnabled);
      
      if (!isEnabled) {
        throw new Error("GPS 서비스가 비활성화되어 있습니다.");
      }

      // 여러 번 시도해서 위치 가져오기
      const maxAttempts = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`📍 위치 가져오기 시도 ${attempt}/${maxAttempts}`);
          
          const location = await Location.getCurrentPositionAsync({
            accuracy: attempt === 1 ? Location.Accuracy.High : Location.Accuracy.Balanced,
            timeInterval: 15000 + (attempt * 5000), // 시도할 때마다 타임아웃 증가
            distanceInterval: 1,
          });

          console.log("✅ 위치 가져오기 성공:", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toLocaleString()
          });

          // 서울 근처인지 확인 (한국 내 위치인지 대략적으로 체크)
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
          
          if (attempt < maxAttempts) {
            console.log("⏳ 2초 후 다시 시도...");
            await new Promise(resolve => setTimeout(resolve, 2000));
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
        const convertedStores: Store[] = data.data.stores.map(store => ({
          storeId: store.id,
          storeName: store.name?.replace(/\s{2,}/g, " ").trim(),
          latitude: store.latitude,
          longitude: store.longitude,
          distance: store.distance,
        }));

        console.log("변환된 가게 데이터:", convertedStores);
        setStores(convertedStores);
        
        if (webViewLoaded) {
          updateMapMarkers(convertedStores);
        }
      } else {
        Alert.alert("오류", data.message || "가게 정보를 불러오는데 실패했습니다.");
      }
    } catch (error: any) {
      console.error("API 호출 실패:", error);
      Alert.alert("오류", `네트워크 오류: ${error.message}`);
    }
  };

  const updateMapMarkers = (storeList: Store[]) => {
    if (webViewRef.current && currentLocation && webViewLoaded) {
      console.log("🗺️ 웹뷰에 마커 업데이트 전송:", storeList.length, "개");
      
      const message = JSON.stringify({
        type: 'updateMarkers',
        stores: storeList,
        centerLat: currentLocation.latitude,
        centerLng: currentLocation.longitude,
        radius: selectedDistance
      });
      
      webViewRef.current.postMessage(message);
    } else {
      console.log("❌ 웹뷰 업데이트 조건 미충족:", {
        hasWebView: !!webViewRef.current,
        hasLocation: !!currentLocation,
        webViewLoaded
      });
    }
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
        console.log("📤 백엔드로 전송할 좌표:", `위도: ${location.latitude}, 경도: ${location.longitude}`);
        
        setCurrentLocation(location);
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
      fetchNearbyStores(currentLocation.latitude, currentLocation.longitude, selectedDistance);
    }
  }, [selectedDistance]);

  useEffect(() => {
    if (webViewLoaded && stores.length > 0 && currentLocation) {
      console.log("🗺️ 웹뷰 로드 완료 후 마커 업데이트");
      updateMapMarkers(stores);
    }
  }, [webViewLoaded, stores]);

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

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === "markerClick") {
        const store = stores.find((s) => s.storeId === data.storeId);
        console.log("🏪 마커 클릭된 가게:", store);
        if (store) {
          setSelectedStore(store);
        }
      } else if (data.type === "mapLoaded") {
        console.log("✅ 지도 로드 완료 알림 받음");
        setWebViewLoaded(true);
      } else if (data.type === "log") {
        console.log("📱 웹뷰 로그:", data.message);
      } else if (data.type === "error") {
        console.error("❌ 웹뷰 오류:", data.message);
      } else if (data.type === "debug") {
        console.log("🐛 웹뷰 디버그:", data.message);
      }
    } catch (error) {
      console.error("❌ 웹뷰 메시지 파싱 오류:", error);
    }
  };

  // 예쁘게 개선된 카카오맵 HTML (로그 함수 포함)
// 개선된 카카오맵 HTML (기존 스타일 유지, 로직만 완전 수정)
const kakaoMapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>카카오맵</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    body { margin: 0; padding: 0; background: #f0f0f0; }
    #map { width: 100%; height: 100vh; background: linear-gradient(45deg, #fff5f8, #fff9f2); }
    
    /* 커스텀 마커 스타일 - 기존 디자인 유지 */
    .custom-marker {
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      border: 3px solid white;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .custom-marker:hover {
      transform: rotate(-45deg) scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.35);
    }
    
    .custom-marker::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      transform: rotate(45deg);
    }
    
    .user-marker {
      background: linear-gradient(135deg, #fc6fae, #e85a9b);
    }
    
    .store-marker {
      background: linear-gradient(135deg, #fcc566, #f5b942);
    }
    
    .user-marker::before {
      background: white;
      box-shadow: inset 0 0 0 2px #fc6fae;
    }
    
    .store-marker::before {
      background: white;
      box-shadow: inset 0 0 0 2px #fcc566;
    }
    
    /* 펄스 애니메이션 */
    @keyframes pulse {
      0% { 
        transform: rotate(-45deg) scale(1); 
        opacity: 1;
      }
      50% { 
        transform: rotate(-45deg) scale(1.2); 
        opacity: 0.7;
      }
      100% { 
        transform: rotate(-45deg) scale(1); 
        opacity: 1;
      }
    }
    
    .user-marker {
      animation: pulse 1.5s infinite;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=clusterer"></script>
  <script>
  // ====== 전역 상태 ======
  const LEVEL_THRESHOLD = 6;           // 줌 레벨 6 이하면 커스텀 마커, 초과하면 클러스터
  const COLORS = { CIRCLE_FILL: '#fc6fae' };

  let map, clusterer, circle, userOverlay;
  let storeOverlays = [];              // 커스텀 오버레이 배열
  let baseMarkers = [];                // 클러스터용 기본 마커 배열
  let currentStores = [];              // 현재 가게 데이터
  let currentMode = null;              // 현재 모드: 'cluster' | 'detail'
  let currentCenter = null;            // 현재 중심점
  let currentRadius = 300;             // 현재 반경

  // ====== RN ↔ WebView 통신 ======
  function send(type, data = {}) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    }
  }
  
  function log(msg) { 
    send('debug', { message: msg }); 
  }

  // 가게 클릭 이벤트
  function handleStoreClick(storeId, storeName) {
    log('🏪 가게 클릭: ' + storeName + ' (ID: ' + storeId + ')');
    send('markerClick', { storeId, storeName });
  }
  window.handleStoreClick = handleStoreClick;

  // ====== 지도 초기화 ======
  function initMap() {
    try {
      const container = document.getElementById('map');
      if (!container) {
        log('❌ 지도 컨테이너를 찾을 수 없음');
        return;
      }

      map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 6,
        mapTypeId: kakao.maps.MapTypeId.ROADMAP
      });

      // 클러스터러 초기화 (처음엔 맵에 연결하지 않음)
      clusterer = new kakao.maps.MarkerClusterer({
        map: null,
        averageCenter: true,
        gridSize: 60,
        disableClickZoom: false,
        clickable: true
      });

      // 줌 변경 이벤트 리스너
      kakao.maps.event.addListener(map, 'zoom_changed', function() {
        setTimeout(handleZoomChange, 100); // 약간의 지연으로 안정성 확보
      });

      log('✅ 지도 초기화 완료');
      send('mapLoaded');
    } catch (error) {
      log('❌ 지도 초기화 오류: ' + error.message);
    }
  }

  // ====== 줌 변경 처리 ======
  function handleZoomChange() {
    if (!map || currentStores.length === 0) return;

    const level = map.getLevel();
    const newMode = level <= LEVEL_THRESHOLD ? 'detail' : 'cluster';
    
    log('🔍 줌 레벨: ' + level + ', 모드: ' + newMode);
    
    if (newMode !== currentMode) {
      switchMode(newMode);
    }
  }

  // ====== 모드 전환 ======
  function switchMode(mode) {
    log('🔀 모드 전환: ' + currentMode + ' → ' + mode);
    
    if (mode === 'detail') {
      // 디테일 모드: 커스텀 마커만 표시
      hideClusterMarkers();
      showCustomMarkers();
    } else {
      // 클러스터 모드: 클러스터만 표시
      hideCustomMarkers();
      showClusterMarkers();
    }
    
    currentMode = mode;
  }

  // ====== 클러스터 마커 관리 ======
  function showClusterMarkers() {
    if (!clusterer || baseMarkers.length === 0) return;
    
    try {
      clusterer.setMap(map);
      clusterer.clear();
      clusterer.addMarkers(baseMarkers);
      log('✅ 클러스터 마커 표시: ' + baseMarkers.length + '개');
    } catch (error) {
      log('❌ 클러스터 표시 오류: ' + error.message);
    }
  }

  function hideClusterMarkers() {
    if (!clusterer) return;
    
    try {
      clusterer.clear();
      clusterer.setMap(null);
      log('✅ 클러스터 마커 숨김');
    } catch (error) {
      log('❌ 클러스터 숨김 오류: ' + error.message);
    }
  }

  // ====== 커스텀 마커 관리 ======
  function showCustomMarkers() {
    if (currentStores.length === 0) return;
    
    try {
      // 기존 커스텀 마커 제거
      hideCustomMarkers();
      
      // 새 커스텀 마커 생성
      currentStores.forEach(store => {
        const markerEl = createCustomMarkerElement(store);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(store.latitude, store.longitude),
          content: markerEl,
          yAnchor: 1,
          clickable: true
        });
        overlay.setMap(map);
        storeOverlays.push(overlay);
      });
      
      log('✅ 커스텀 마커 표시: ' + storeOverlays.length + '개');
    } catch (error) {
      log('❌ 커스텀 마커 표시 오류: ' + error.message);
    }
  }

  function hideCustomMarkers() {
    try {
      storeOverlays.forEach(overlay => {
        if (overlay && overlay.setMap) {
          overlay.setMap(null);
        }
      });
      storeOverlays = [];
      log('✅ 커스텀 마커 숨김');
    } catch (error) {
      log('❌ 커스텀 마커 숨김 오류: ' + error.message);
    }
  }

  function createCustomMarkerElement(store) {
    const el = document.createElement('div');
    el.className = 'custom-marker store-marker';
    el.title = store.storeName;
    el.onclick = function() {
      handleStoreClick(store.storeId, store.storeName);
    };
    return el;
  }

  // ====== 기본 마커 생성 (클러스터용) ======
  function createBaseMarkers(stores) {
    try {
      // 기존 마커 정리
      baseMarkers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      });
      baseMarkers = [];

      // 새 마커 생성
      stores.forEach(store => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(store.latitude, store.longitude),
          title: store.storeName,
          map: null // 처음엔 맵에 표시하지 않음
        });

        // 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', function() {
          handleStoreClick(store.storeId, store.storeName);
        });

        baseMarkers.push(marker);
      });

      log('✅ 기본 마커 생성: ' + baseMarkers.length + '개');
    } catch (error) {
      log('❌ 기본 마커 생성 오류: ' + error.message);
    }
  }

  // ====== 사용자 위치 마커 ======
  function updateUserMarker(lat, lng) {
    try {
      // 기존 사용자 마커 제거
      if (userOverlay) {
        userOverlay.setMap(null);
      }

      // 새 사용자 마커 생성
      const userEl = document.createElement('div');
      userEl.className = 'custom-marker user-marker';
      userEl.title = '현재 위치';

      userOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(lat, lng),
        content: userEl,
        yAnchor: 1,
        clickable: false
      });
      userOverlay.setMap(map);

      log('✅ 사용자 마커 업데이트');
    } catch (error) {
      log('❌ 사용자 마커 오류: ' + error.message);
    }
  }

  // ====== 반경 원 ======
  function updateCircle(lat, lng, radius) {
    try {
      // 기존 원 제거
      if (circle) {
        circle.setMap(null);
      }

      // 새 원 생성
      circle = new kakao.maps.Circle({
        center: new kakao.maps.LatLng(lat, lng),
        radius: radius,
        strokeWeight: 0,
        strokeOpacity: 0,
        fillColor: COLORS.CIRCLE_FILL,
        fillOpacity: 0.15
      });
      circle.setMap(map);

      log('✅ 반경 원 업데이트: ' + radius + 'm');
    } catch (error) {
      log('❌ 반경 원 오류: ' + error.message);
    }
  }

  // ====== 지도 범위 조정 ======
  function fitMapBounds(centerLat, centerLng, stores) {
    if (!map || stores.length === 0) return;

    try {
      const bounds = new kakao.maps.LatLngBounds();
      
      // 중심점 추가
      bounds.extend(new kakao.maps.LatLng(centerLat, centerLng));
      
      // 모든 가게 위치 추가
      stores.forEach(store => {
        bounds.extend(new kakao.maps.LatLng(store.latitude, store.longitude));
      });

      // 지도 범위 설정 (패딩 50px)
      map.setBounds(bounds, 50);
      
      // 최대 줌 레벨 제한
      if (map.getLevel() > 12) {
        map.setLevel(12);
      }

      log('✅ 지도 범위 조정 완료');
    } catch (error) {
      log('❌ 지도 범위 조정 오류: ' + error.message);
    }
  }

  // ====== 메인 업데이트 함수 ======
  function updateMapData(stores, centerLat, centerLng, radius) {
    try {
      log('🔄 지도 데이터 업데이트 시작');
      log('📍 중심점: ' + centerLat + ', ' + centerLng);
      log('📏 반경: ' + radius + 'm');
      log('🏪 가게 수: ' + stores.length + '개');

      // 전역 상태 업데이트
      currentStores = stores || [];
      currentCenter = { lat: centerLat, lng: centerLng };
      currentRadius = radius;

      // 지도 중심 이동
      map.setCenter(new kakao.maps.LatLng(centerLat, centerLng));

      // 사용자 위치 마커 업데이트
      updateUserMarker(centerLat, centerLng);

      // 반경 원 업데이트
      updateCircle(centerLat, centerLng, radius);

      // 기본 마커 생성 (클러스터용)
      createBaseMarkers(currentStores);

      // 지도 범위 조정
      fitMapBounds(centerLat, centerLng, currentStores);

      // 현재 줌 레벨에 따라 적절한 모드 적용
      setTimeout(() => {
        handleZoomChange();
      }, 200);

      log('✅ 지도 데이터 업데이트 완료');
    } catch (error) {
      log('❌ 지도 데이터 업데이트 오류: ' + error.message);
    }
  }

  // ====== RN → Web 메시지 처리 ======
  function handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      log('📨 메시지 수신: ' + data.type);
      
      if (data.type === 'updateMarkers') {
        updateMapData(data.stores, data.centerLat, data.centerLng, data.radius);
      }
    } catch (error) {
      log('❌ 메시지 처리 오류: ' + error.message);
    }
  }

  // 메시지 리스너 등록
  document.addEventListener('message', handleMessage);
  window.addEventListener('message', handleMessage);

  // ====== 카카오 SDK 로드 대기 ======
  function waitForKakaoSDK() {
    if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.MarkerClusterer) {
      log('✅ 카카오 SDK 로드 완료');
      initMap();
    } else {
      log('⏳ 카카오 SDK 로딩 중...');
      setTimeout(waitForKakaoSDK, 100);
    }
  }

  // SDK 로드 시작
  waitForKakaoSDK();
  </script>
</body>
</html>
`;

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
        <WebView
          ref={webViewRef}
          source={{ html: kakaoMapHtml }}
          style={styles.map}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          allowsInlineMediaPlayback={true}
          mixedContentMode="compatibility"
          onLoadStart={() => console.log('🔄 웹뷰 로드 시작')}
          onLoadEnd={() => console.log('✅ 웹뷰 로드 완료')}
          onError={(e) => console.error('❌ 웹뷰 오류:', e.nativeEvent)}
        />
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
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
});