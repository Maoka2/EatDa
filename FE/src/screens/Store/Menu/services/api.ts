// src/screens/Store/Menu/services/api.ts

import { getTokens } from "../../../Login/services/tokenStorage";
const BASE_URL = "https://i13a609.p.ssafy.io/test";

export type StoreMenuItem = {
  menuId: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
};

export interface ApiResponse<T> {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
}

// 가게 메뉴 조회 API
export async function getStoreMenu(storeId: number): Promise<StoreMenuItem[]> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_URL}/api/menu/${encodeURIComponent(String(storeId))}`;

  const started = Date.now();
  console.log(`[MENU][REQ] GET ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const elapsed = Date.now() - started;
  const raw = await res.text();
  console.log(
    `[MENU][RES] ${res.status} (${elapsed}ms) raw: ${raw.slice(0, 300)}${
      raw.length > 300 ? "..." : ""
    }`
  );

  let json: ApiResponse<StoreMenuItem[]> | null = null;
  try {
    json = raw ? (JSON.parse(raw) as ApiResponse<StoreMenuItem[]>) : null;
  } catch {
    // 서버가 JSON이 아니면 그대로 처리 (명세 우선)
  }

  if (!res.ok) {
    // 명세서: 401 인증 실패
    if (res.status === 401) {
      throw new Error(json?.message || "인증이 필요합니다.");
    }
    // 나머지는 서버가 내려준 메시지 그대로(500 포함)
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (!json || !Array.isArray(json.data)) {
    throw new Error("응답 형식이 올바르지 않습니다.");
  }

  return json.data;
}

// 메뉴판 꾸미기 버튼을 눌렀을 때 나올 메뉴 정보 불러오기
export type MenuSelectItem = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
};

export async function getStoreMenus(
  storeId: number,
  accessToken?: string
): Promise<MenuSelectItem[]> {
  // accessToken이 오면 그것도 허용, 없으면 내부에서 getTokens()
  let token = accessToken;
  if (!token) {
    const t = await getTokens();
    token = t.accessToken ?? "";
  }
  if (!token) throw new Error("인증이 필요합니다.");

  const url = `${BASE_URL}/api/menu/${encodeURIComponent(String(storeId))}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const raw = await res.text();

  let json: ApiResponse<StoreMenuItem[]> | null = null;
  try {
    json = raw ? (JSON.parse(raw) as ApiResponse<StoreMenuItem[]>) : null;
  } catch {}

  if (!res.ok) {
    if (res.status === 401)
      throw new Error(json?.message || "인증이 필요합니다.");
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (!json || !Array.isArray(json.data)) {
    throw new Error("응답 형식이 올바르지 않습니다.");
  }

  return json.data.map((m) => ({
    id: m.menuId,
    name: m.name,
    description: m.description ?? "",
    imageUrl: m.imageUrl,
    price: m.price,
  }));
}

// 메뉴 포스터 asset 생성 요청 API
export type MenuPosterRequest = {
  storeId: number;
  menuIds: number[]; // 같은 키(menuIds)로 반복 append
  prompt: string;
  images: Array<
    | { uri: string; name?: string; type?: string } // React Native 형식
    | any // expo-image-picker 등에서 오는 파일 객체
  >;
};

export type MenuPosterResponse = {
  menuPosterId: number;
};

type ApiEnvelope<T> = {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
};

export const requestMenuPosterAsset = async (formData: FormData) => {
  const { accessToken } = await getTokens();

  const res = await fetch(`${BASE_URL}/api/menu-posters/assets/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("ASSET REQ ERR", { status, raw });
    throw new Error((json && (json.message || json.error)) || raw);
  }

  return json;
};

// 메뉴 포스터 상태 조회 API

// 메뉴 포스터 생성 상태 조회 API

// 메뉴 포스터 최종 등록 API

// 메뉴 포스터 선물 API

// 선물 받은 메뉴 포스터 채택 API

// 채택한 메뉴 포스터 해제 API

// 채택한 메뉴 포스터 순서 변경 API
