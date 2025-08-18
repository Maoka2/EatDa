import { API_KEYS } from "../../../../config/apiKeys";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

// Google Geocoding API를 사용하여 주소를 좌표로 변환
export const getCoordinatesFromAddress = async (
  address: string
): Promise<GeocodingResult | null> => {
  console.log("getCoordinatesFromAddress 호출됨:", address);

  try {
    const GOOGLE_MAPS_API_KEY = API_KEYS.GOOGLE_MAPS;
    console.log("API 키 확인:", GOOGLE_MAPS_API_KEY ? "설정됨" : "설정안됨");

    if (
      !GOOGLE_MAPS_API_KEY ||
      GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY"
    ) {
      console.warn(
        "Google Maps API 키가 설정되지 않았습니다. 더미 데이터 반환"
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        latitude: 37.5666805 + (Math.random() - 0.5) * 0.01,
        longitude: 126.9784147 + (Math.random() - 0.5) * 0.01,
        formattedAddress: `서울특별시 중구 ${address}`,
      };
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}&language=ko&region=kr`;

    console.log("API 요청 URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log("API 응답:", data);

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const geocodingResult = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
      console.log("변환 결과:", geocodingResult);
      return geocodingResult;
    } else {
      console.error("Geocoding failed:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// Naver Geocoding API 대안
export const getCoordinatesFromAddressNaver = async (
  address: string
): Promise<GeocodingResult | null> => {
  console.log("getCoordinatesFromAddressNaver 호출됨:", address);

  try {
    const NAVER_CLIENT_ID = API_KEYS.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = API_KEYS.NAVER_CLIENT_SECRET;

    if (
      !NAVER_CLIENT_ID ||
      !NAVER_CLIENT_SECRET ||
      NAVER_CLIENT_ID === "YOUR_NAVER_CLIENT_ID" ||
      NAVER_CLIENT_SECRET === "YOUR_NAVER_CLIENT_SECRET"
    ) {
      console.warn("Naver API 키가 설정되지 않았습니다. 더미 데이터 반환");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        latitude: 37.498095 + (Math.random() - 0.5) * 0.01,
        longitude: 127.02761 + (Math.random() - 0.5) * 0.01,
        formattedAddress: `서울특별시 강남구 ${address}`,
      };
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodedAddress}`;

    const response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
      },
    });

    const data = await response.json();

    if (data.status === "OK" && data.addresses.length > 0) {
      const result = data.addresses[0];
      return {
        latitude: parseFloat(result.y),
        longitude: parseFloat(result.x),
        formattedAddress: result.roadAddress || result.jibunAddress,
      };
    } else {
      console.error("Naver Geocoding failed:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Naver Geocoding error:", error);
    return null;
  }
};
