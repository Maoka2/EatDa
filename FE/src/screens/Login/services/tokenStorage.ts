// src/screens/Login/services/tokenStorage.ts
// npm install @react-native-async-storage/async-storage
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// 토큰 저장용
export const saveTokens = async (tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (e) {
    console.error("토큰 저장 실패", e);
  }
};

// 저장된 토큰 리턴
export const getTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  } catch (e) {
    console.error("토큰 불러오기 실패", e);
    return { accessToken: null, refreshToken: null };
  }
};

// 로그아웃용
export const removeTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error("토큰 삭제 실패", e);
  }
};
