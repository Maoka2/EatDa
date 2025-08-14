import { getTokens } from "../../../Login/services/tokenStorage";
// const BASE_URL = "https://i13a609.p.ssafy.io/test";

const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test";
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

// ==================== 공통 타입 ====================

export interface MenuData {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  price?: number;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
}


export const getStoreMenus = async (
  storeId: number,
  accessToken: string
): Promise<MenuData[]> => {
  const url = `${BASE_API_URL}/menu/${storeId}`;
  console.log("[getStoreMenus] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[getStoreMenus] status:", res.status, "payload:", text);
    throw new Error(text || "메뉴 조회 실패");
  }

  let json: any = {};
  try {
    json = JSON.parse(text || "{}");
  } catch {
    throw new Error("잘못된 응답 형식입니다.");
  }

  const menus = json.data?.menus || json.menus || json.data || [];

  return menus.map((menu: any) => ({
    id: menu.id,
    name: menu.name,
    description: menu.description || "",
    imageUrl: menu.imageUrl,
    price: menu.price,
  }));
};

// ==================== 포스터 asset 요청 ====================

export type MenuPosterRequest = {
  storeId: number;
  menuIds: number[];
  prompt: string;
  images: Array<{ uri: string; name?: string; type?: string } | any>;
};

export type MenuPosterResponse = {
  menuPosterId: number;
};

export const requestMenuPosterAsset = async (formData: FormData) => {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const res = await fetch(`${BASE_API_URL}/menu-posters/assets/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    // 비JSON 응답 대비
  }

  if (!res.ok) {
    console.error("ASSET REQ ERR", { status: res.status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${res.status}`
    );
  }

  // ← 응답 유연 파싱: data 안/밖 모두 대응
  const dataObj = json?.data ?? json;
  const menuPosterId =
    typeof dataObj?.menuPosterId === "number"
      ? dataObj.menuPosterId
      : typeof dataObj?.id === "number"
      ? dataObj.id
      : NaN;

  if (!Number.isFinite(menuPosterId)) {
    console.warn("[requestMenuPosterAsset] unexpected response shape:", json);
    return { raw: json };
  }

  // 필요시 향후 확장을 대비해 원본도 함께 반환
  return { menuPosterId, raw: json };
};

// ==================== 포스터 생성 상태 조회 ====================

export interface MenuPosterResultResponse {
  type: string; // IMAGE 등
  assetUrl?: string;
  menuPosterAssetId?: number;
}

export async function getMenuPosterResult(
  menuPosterId: number
): Promise<MenuPosterResultResponse | null> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/${encodeURIComponent(
    String(menuPosterId)
  )}/result`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const raw = await res.text();
  let json: ApiResponse<MenuPosterResultResponse> | null = null;
  try {
    json = raw
      ? (JSON.parse(raw) as ApiResponse<MenuPosterResultResponse>)
      : null;
  } catch {}

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (!json) throw new Error("응답 형식이 올바르지 않습니다.");
  return json.data ?? null;
}

export const waitForMenuPosterReady = async (
  menuPosterId: number,
  {
    intervalMs = 5000,
    maxWaitMs = 120000,
    onTick,
  }: {
    intervalMs?: number;
    maxWaitMs?: number;
    onTick?: (status: string | null, assetUrl?: string) => void;
  } = {}
): Promise<{ assetUrl: string; assetId: number }> => {
  const started = Date.now();

  while (true) {
    try {
      const res = await getMenuPosterResult(menuPosterId);
      const status = res?.assetUrl ? "READY" : "WAITING";
      onTick?.(status, res?.assetUrl);

      if (res?.assetUrl && res?.menuPosterAssetId != null) {
        return { assetUrl: res.assetUrl, assetId: res.menuPosterAssetId };
      }
    } catch (e) {
      console.warn("[POLL] 상태 조회 실패:", e);
    }

    const elapsed = Date.now() - started;
    if (elapsed >= maxWaitMs) {
      throw new Error("메뉴포스터 생성 시간이 초과되었습니다.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
};

// ==================== 포스터 최종 등록 ====================

export interface FinalizeMenuPosterRequest {
  menuPosterId: number;
  menuPosterAssetId: number;
  description: string;
  type: string;
}

// 메뉴 포스터 최종 완료 요청
export async function finalizeMenuPoster(
  data: FinalizeMenuPosterRequest
): Promise<ApiResponse<any>> {
  const { accessToken } = await getTokens();

  const res = await fetch(`${BASE_API_URL}/menu-posters/finalize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const raw = await res.text();
  const json = JSON.parse(raw);
  if (!res.ok) {
    console.error("[POST][finalizeMenuPoster] 실패", raw);
    throw new Error(json?.message || raw || "에러 발생");
  }

  return json;
}

// 메뉴 포스터 선물 API
export interface SendMenuPosterRequest {
  menuPosterId: number;
}

export interface SendMenuPosterResponse {
  code: string;
  message: string;
  status: number;
  data: null;
  timestamp: string;
}

export async function sendMenuPoster(
  payload: SendMenuPosterRequest
): Promise<SendMenuPosterResponse> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/send`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let json: SendMenuPosterResponse | null = null;
  try {
    json = raw ? (JSON.parse(raw) as SendMenuPosterResponse) : null;
  } catch {}

  if (!res.ok) {
    throw new Error(json?.message || raw || `HTTP ${res.status}`);
  }

  return json!;
}

// ==================== 메뉴 포스터 채택(교체 저장) ====================

export interface AdoptMenuPostersRequest {
  storeId: number;
  menuPosterIds: number[]; // 최대 5개, 중복 불가
}

export interface AdoptMenuPostersData {
  storeId: number;
  adoptedMenuPosterIds: number[];
}

export type AdoptMenuPostersResponse = ApiResponse<AdoptMenuPostersData | null>;

export async function adoptMenuPosters(
  payload: AdoptMenuPostersRequest
): Promise<AdoptMenuPostersData> {
  const { storeId, menuPosterIds } = payload;

  // ---- 클라이언트 선검증 ----
  if (!storeId || typeof storeId !== "number") {
    throw new Error("유효한 storeId가 필요합니다.");
  }
  if (!Array.isArray(menuPosterIds) || menuPosterIds.length === 0) {
    throw new Error("menuPosterIds는 최소 1개 이상이어야 합니다.");
  }
  if (menuPosterIds.length > 5) {
    throw new Error("menuPosterIds는 최대 5개까지 선택 가능합니다.");
  }
  const set = new Set(menuPosterIds);
  if (set.size !== menuPosterIds.length) {
    throw new Error("menuPosterIds에는 중복이 없어야 합니다.");
  }

  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/adopted`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ storeId, menuPosterIds }),
  });

  const raw = await res.text();
  let json: AdoptMenuPostersResponse | null = null;
  try {
    json = raw ? (JSON.parse(raw) as AdoptMenuPostersResponse) : null;
  } catch {
    // 서버가 예외적으로 비JSON을 줄 가능성 방어
  }

  if (!res.ok) {
    // 명세상의 에러 메시지 우선 사용
    throw new Error((json && json.message) || raw || `HTTP ${res.status}`);
  }

  // 성공 응답: data 안에 { storeId, adoptedMenuPosterIds } 기대
  const dataObj = (json && json.data) as AdoptMenuPostersData | null;

  if (dataObj && Array.isArray(dataObj.adoptedMenuPosterIds)) {
    return dataObj;
  }

  // 혹시 서버가 data를 null로 주거나 구조가 다른 경우, 최소한 클라가 보낸 값으로 정상 리턴
  // (백엔드와 응답 구조 합의되면 이 fallback은 제거해도 됨)
  return {
    storeId,
    adoptedMenuPosterIds: menuPosterIds,
  };
}
// ==================== 메뉴 포스터 채택 해제 ====================

export interface UnadoptMenuPosterRequest {
  storeId: number;
  menuPosterId: number;
}

export interface UnadoptMenuPosterResponseData {
  storeId: number;
  unadoptedMenuPosterIds: number[];
}

export async function unadoptMenuPoster(
  payload: UnadoptMenuPosterRequest
): Promise<ApiResponse<UnadoptMenuPosterResponseData>> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/adopted`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    // 명세상 DELETE 도 JSON 본문으로 전달
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let json: ApiResponse<UnadoptMenuPosterResponseData> | null = null;
  try {
    json = raw
      ? (JSON.parse(raw) as ApiResponse<UnadoptMenuPosterResponseData>)
      : null;
  } catch {
    // 비 JSON 응답 대비
  }

  if (!res.ok) {
    throw new Error((json && json.message) || raw || `HTTP ${res.status}`);
  }

  if (!json) throw new Error("응답 형식이 올바르지 않습니다.");
  return json;
}

// ==================== 채택된 메뉴 포스터 정렬 순서 업데이트 ====================

export interface UpdateAdoptedSortOrderRequest {
  storeId: number;
  sortedPosterIds: number[];
}

export interface UpdateAdoptedSortOrderResponseData {
  storeId: number;
  updatedPosterIds: number[];
}

/**
 * 채택된 메뉴판의 노출 순서를 수정합니다.
 * PUT /api/menu-posters/adopted/sort-order
 */
export async function updateAdoptedMenuPosterSortOrder(
  payload: UpdateAdoptedSortOrderRequest
): Promise<ApiResponse<UpdateAdoptedSortOrderResponseData>> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/adopted/sort-order`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let json: ApiResponse<UpdateAdoptedSortOrderResponseData> | null = null;
  try {
    json = raw
      ? (JSON.parse(raw) as ApiResponse<UpdateAdoptedSortOrderResponseData>)
      : null;
  } catch {
    // 비 JSON 응답 대비
  }

  if (!res.ok) {
    // 명세: 400 / 401 / 403 / 500
    throw new Error((json && json.message) || raw || `HTTP ${res.status}`);
  }

  if (!json) throw new Error("응답 형식이 올바르지 않습니다.");
  return json;
}
