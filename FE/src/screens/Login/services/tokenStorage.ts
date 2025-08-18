// src/screens/Login/services/tokenStorage.ts
// npm install @react-native-async-storage/async-storage
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "userRole"; // 'EATER' | 'MAKER'

export type Role = "EATER" | "MAKER";
export type Tokens = { accessToken: string; refreshToken: string };

// ──────────────────────────────────────────────────────────────
// Save
// ──────────────────────────────────────────────────────────────
export const saveTokens = async (tokens: Tokens): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, tokens.accessToken],
      [REFRESH_TOKEN_KEY, tokens.refreshToken],
    ]);
  } catch (e) {
    console.error("토큰 저장 실패", e);
  }
};

export const saveRole = async (role: Role): Promise<void> => {
  try {
    await AsyncStorage.setItem(ROLE_KEY, role);
  } catch (e) {
    console.error("역할 저장 실패", e);
  }
};

// 토큰 + 역할 한 번에 저장
export const saveAuth = async (tokens: Tokens, role: Role): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, tokens.accessToken],
      [REFRESH_TOKEN_KEY, tokens.refreshToken],
      [ROLE_KEY, role],
    ]);
  } catch (e) {
    console.error("인증정보 저장 실패", e);
  }
};

// ──────────────────────────────────────────────────────────────
export const getTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  try {
    const entries = await AsyncStorage.multiGet([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
    ]);
    const map = Object.fromEntries(entries);
    return {
      accessToken: map[ACCESS_TOKEN_KEY] ?? null,
      refreshToken: map[REFRESH_TOKEN_KEY] ?? null,
    };
  } catch (e) {
    console.error("토큰 불러오기 실패", e);
    return { accessToken: null, refreshToken: null };
  }
};

export const getRole = async (): Promise<Role | null> => {
  try {
    const role = await AsyncStorage.getItem(ROLE_KEY);
    return (role as Role) || null;
  } catch (e) {
    console.error("역할 불러오기 실패", e);
    return null;
  }
};

// 토큰 + 역할 한 번에 조회
export const getAuth = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
}> => {
  try {
    const entries = await AsyncStorage.multiGet([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      ROLE_KEY,
    ]);
    const map = Object.fromEntries(entries);
    return {
      accessToken: map[ACCESS_TOKEN_KEY] ?? null,
      refreshToken: map[REFRESH_TOKEN_KEY] ?? null,
      role: (map[ROLE_KEY] as Role) ?? null,
    };
  } catch (e) {
    console.error("인증정보 불러오기 실패", e);
    return { accessToken: null, refreshToken: null, role: null };
  }
};

// ──────────────────────────────────────────────────────────────
// Remove / Helpers
// ──────────────────────────────────────────────────────────────
export const removeTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (e) {
    console.error("토큰 삭제 실패", e);
  }
};

// 토큰 + 역할 한 번에 삭제
export const removeAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      ROLE_KEY,
    ]);
  } catch (e) {
    console.error("인증정보 삭제 실패", e);
  }
};

// 두 토큰이 모두 있는지 여부
export const hasTokens = async (): Promise<boolean> => {
  const { accessToken, refreshToken } = await getTokens();
  return Boolean(accessToken) && Boolean(refreshToken);
};
