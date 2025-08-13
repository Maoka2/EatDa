// src/screens/Store/Menu/services/api.ts

import { getTokens } from "../../../Login/services/tokenStorage";
const BASE_URL = "https://i13a609.p.ssafy.io/test";

export type StoreMenuItem = {
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
  description: string;
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

  // MenuSelectStep이 기대하는 형태로 매핑
  return json.data.map((m, idx) => ({
    id: idx + 1, // 서버에 id가 없으니 index+1
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

export async function requestMenuPosterAsset(
  req: MenuPosterRequest
): Promise<MenuPosterResponse> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증이 필요합니다.");
  }

  // Validation
  if (!req.storeId || req.storeId <= 0) {
    throw new Error("유효한 storeId가 필요합니다.");
  }
  if (!Array.isArray(req.menuIds) || req.menuIds.length === 0) {
    throw new Error("menuIds는 1개 이상이어야 합니다.");
  }
  if (!req.prompt || !req.prompt.trim()) {
    throw new Error("prompt는 비어 있을 수 없습니다.");
  }
  if (!Array.isArray(req.images) || req.images.length === 0) {
    throw new Error("images는 1개 이상이어야 합니다.");
  }

  const TEN_MB = 10 * 1024 * 1024;
  const overs = req.images.filter(
    (img: any) => typeof img?.size === "number" && img.size > TEN_MB
  );
  if (overs.length)
    throw new Error("이미지 파일은 개당 10MB를 초과할 수 없습니다.");

  const fd = new FormData();
  fd.append("storeId", String(req.storeId));
  req.menuIds.forEach((id) => fd.append("menuIds", String(id)));
  fd.append("prompt", req.prompt);

  // 파일 필드명은 images (반복)
  req.images.forEach((img, index) => {
    // 기본 확장/타입 지정 (없으면 jpeg로)
    const name = (img as any)?.name || `poster_ref_${index}.jpg`;
    const type = (img as any)?.type || "image/jpeg";
    const uri = (img as any)?.uri || img;

    fd.append("images", {
      uri,
      name,
      type,
    } as any);
  });

  const url = `${BASE_URL}/api/menu-posters/assets/request`;
  const started = Date.now();
  console.log("[MENU_POSTER][REQ] POST", url);
  console.log(
    "[MENU_POSTER][REQ] body summary:",
    JSON.stringify(
      {
        storeId: req.storeId,
        menuIds: req.menuIds,
        promptLen: req.prompt.length,
        imagesCount: req.images.length,
      },
      null,
      2
    )
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // ⚠️ Content-Type 직접 지정 금지 (RN가 경계 + boundary 자동 설정)
    },
    body: fd,
  });

  const elapsed = Date.now() - started;
  const raw = await res.text();
  console.log(
    `[MENU_POSTER][RES] ${res.status} (${elapsed}ms) raw:`,
    raw?.slice(0, 400)
  );

  // ── 명세서 준수: 202 + data.menuPosterId
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    // JSON이 아닐 수도 있으니 그대로 둠
  }
  const json = parsed as ApiEnvelope<{ menuPosterId: number }> | null;

  if (!res.ok) {
    // 명세 예외 응답 메시지 + details까지 친절히 출력
    const baseMsg =
      json?.message ||
      (parsed && (parsed.message || parsed.error)) ||
      raw ||
      `HTTP ${res.status}`;
    const details = (parsed && parsed.details) || (json as any)?.details;
    const detailsMsg =
      details && typeof details === "object"
        ? Object.entries(details)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join("\n")
        : null;

    throw new Error(detailsMsg ? `${baseMsg}\n${detailsMsg}` : baseMsg);
  }

  if (
    !json ||
    json.status !== 202 ||
    !json.data ||
    typeof json.data.menuPosterId !== "number"
  ) {
    console.warn("[MENU_POSTER] unexpected response shape:", json);
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }

  return { menuPosterId: json.data.menuPosterId };
}

// 메뉴 포스터 상태 조회 API

// 메뉴 포스터 생성 상태 조회 API

// 메뉴 포스터 최종 등록 API

// 메뉴 포스터 선물 API

// 선물 받은 메뉴 포스터 채택 API

// 채택한 메뉴 포스터 해제 API

// 채택한 메뉴 포스터 순서 변경 API
