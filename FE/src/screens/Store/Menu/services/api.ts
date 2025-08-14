import { getTokens } from "../../../Login/services/tokenStorage";
const BASE_URL = "https://i13a609.p.ssafy.io/test";

// ==================== 공통 타입 ====================

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

// ==================== 메뉴 불러오기 ====================

export async function getStoreMenu(storeId: number): Promise<StoreMenuItem[]> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_URL}/api/menu/${encodeURIComponent(String(storeId))}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const raw = await res.text();
  let json: ApiResponse<StoreMenuItem[]> | null = null;
  try {
    json = raw ? (JSON.parse(raw) as ApiResponse<StoreMenuItem[]>) : null;
  } catch {}

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(json?.message || "인증이 필요합니다.");
    }
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (!json || !Array.isArray(json.data)) {
    throw new Error("응답 형식이 올바르지 않습니다.");
  }

  return json.data;
}

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

  // 공통 envelope 파싱 시도
  let env: any = null;
  try {
    env = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("응답이 JSON 형식이 아닙니다.");
  }

  if (!res.ok) {
    if (res.status === 401)
      throw new Error(env?.message || "인증이 필요합니다.");
    throw new Error(env?.message || `HTTP ${res.status}`);
  }

  const data = env?.data;
  if (!data) throw new Error("응답 형식이 올바르지 않습니다.");

  // 케이스 A: 기존 형식 — data가 배열이고 각 원소에 menuId 포함
  if (Array.isArray(data)) {
    return data.map((m: any) => {
      const id =
        typeof m?.menuId === "number"
          ? m.menuId
          : typeof m?.id === "number"
          ? m.id
          : NaN;

      if (!Number.isFinite(id)) {
        throw new Error("응답에 menuId가 없습니다.");
      }

      return {
        id,
        name: String(m?.name ?? ""),
        description: String(m?.description ?? ""),
        imageUrl: m?.imageUrl ?? undefined,
        price: typeof m?.price === "number" ? m.price : undefined,
      } as MenuSelectItem;
    });
  }

  // 케이스 B: 분리형 — data = { menuIds: number[], menus: Array<...> }
  const menuIds: any[] = Array.isArray(data?.menuIds) ? data.menuIds : [];
  const menus: any[] = Array.isArray(data?.menus) ? data.menus : [];

  if (menuIds.length && menus.length) {
    if (menuIds.length !== menus.length) {
      throw new Error("응답의 menuIds와 menus 길이가 일치하지 않습니다.");
    }
    return menus.map((m, idx) => {
      const id = menuIds[idx];
      if (!Number.isFinite(id)) {
        throw new Error("응답의 menuIds에 유효하지 않은 값이 있습니다.");
      }
      return {
        id,
        name: String(m?.name ?? ""),
        description: String(m?.description ?? ""),
        imageUrl: m?.imageUrl ?? undefined,
        price: typeof m?.price === "number" ? m.price : undefined,
      } as MenuSelectItem;
    });
  }

  // 어떤 케이스에도 맞지 않으면 오류
  throw new Error("응답 형식이 올바르지 않습니다. (지원되지 않는 data 구조)");
}

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

  const res = await fetch(`${BASE_URL}/api/menu-posters/assets/request`, {
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

  const url = `${BASE_URL}/api/menu-posters/${encodeURIComponent(
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

  const res = await fetch(`${BASE_URL}/api/menu-posters/finalize`, {
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

  const url = `${BASE_URL}/api/menu-posters/send`;

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

// 선물 받은 메뉴 포스터 채택 API
// 채택한 메뉴 포스터 해제 API
// 채택한 메뉴 포스터 순서 변경 API
