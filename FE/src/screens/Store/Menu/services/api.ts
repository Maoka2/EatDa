// src/screens/Store/MenuPoster/services/api.ts
import { getTokens } from "../../../Login/services/tokenStorage";
import * as FileSystem from "expo-file-system";

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

// ==================== 로깅/페치 유틸 ====================

type AnyObj = Record<string, any>;
const DEBUG_HTTP = true;
const MAX_SNIPPET = 800;

const nowIso = () => new Date().toISOString();
const rid = (prefix = "REQ") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const snip = (v: unknown, n = MAX_SNIPPET) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
};

const maskAuth = (headers: any) => {
  if (!headers) return headers;
  try {
    const h =
      typeof headers.get === "function"
        ? Object.fromEntries((headers as any).entries())
        : { ...headers };
    if (h.Authorization) h.Authorization = "Bearer ***";
    if (h.authorization) h.authorization = "Bearer ***";
    return h;
  } catch {
    return headers;
  }
};

const metaLog = (label: string, meta: AnyObj) => {
  if (!DEBUG_HTTP) return;
  console.info(`${label}\n` + JSON.stringify(meta, null, 2));
};

type SpecApiResponse<T> = {
  code: string;
  message: string;
  status: number;
  data: T | null;
  timestamp?: string;
};

const specLog = (label: string, body: SpecApiResponse<any>) => {
  console.info(`${label}\n` + JSON.stringify(body, null, 2));
};

const safeJsonParse = <T = any>(
  text: string
): { json: T | null; error: string | null } => {
  if (!text) return { json: null, error: null };
  try {
    return { json: JSON.parse(text) as T, error: null };
  } catch (e: any) {
    return { json: null, error: e?.message || "JSON parse failed" };
  }
};

const fmtBytes = (bytes?: number | null) => {
  if (bytes == null) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const fixed = i === 0 ? 0 : 2;
  return `${n.toFixed(fixed)} ${units[i]}`;
};

async function getUriSizeSafe(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info && typeof (info as any).size === "number") {
      return (info as any).size as number;
    }
    return null;
  } catch {
    return null;
  }
}

type FetchWithLogsOptions = {
  label: string;
  reqId?: string;
  expectJson?: boolean; // 응답 JSON 기대
  note?: AnyObj; // 추가 메타
  // FormData 업로드 시 파일 사이즈를 로깅하고 싶으면 넘겨라
  filesForLog?: Array<{ uri: string; name?: string; type?: string }>;
};

async function maybeBuildUploadSizesNote(
  body: any,
  filesForLog?: Array<{ uri: string; name?: string; type?: string }>
) {
  // 1순위: 명시적으로 넘어온 filesForLog
  let items: Array<{
    uri?: string;
    name?: string;
    type?: string;
    size?: number | null;
  }> = [];
  if (Array.isArray(filesForLog) && filesForLog.length > 0) {
    items = await Promise.all(
      filesForLog.map(async (f) => {
        const size = f.uri ? await getUriSizeSafe(f.uri) : null;
        return { ...f, size };
      })
    );
  } else if (body instanceof FormData) {
    // 2순위: RN FormData의 비공식 _parts 스캔 (가능할 때만)
    const parts = (body as any)?._parts;
    if (Array.isArray(parts)) {
      const imgRows = parts.filter(
        (p) =>
          Array.isArray(p) &&
          typeof p[0] === "string" &&
          String(p[0]).toLowerCase().includes("image")
      );
      for (const row of imgRows) {
        const v = row[1];
        if (v && typeof v === "object" && typeof v.uri === "string") {
          const size = await getUriSizeSafe(v.uri);
          items.push({ uri: v.uri, name: v.name, type: v.type, size });
        } else if (v && typeof (v as any).size === "number") {
          // Blob/File 케이스
          items.push({ name: v.name, type: v.type, size: (v as any).size });
        }
      }
    }
  }

  if (items.length === 0) return undefined;

  const totalBytes =
    items.reduce(
      (acc, cur) => acc + (typeof cur.size === "number" ? cur.size : 0),
      0
    ) || 0;

  return {
    uploadFiles: items.map((it, idx) => ({
      idx,
      name: it.name ?? "(no-name)",
      type: it.type ?? "(unknown)",
      uriSnippet: it.uri ? snip(it.uri, 80) : undefined,
      sizeBytes: typeof it.size === "number" ? it.size : null,
      sizeHuman: typeof it.size === "number" ? fmtBytes(it.size) : "unknown",
    })),
    uploadTotalBytes: totalBytes,
    uploadTotalHuman: fmtBytes(totalBytes),
  };
}

async function fetchWithLogs(
  url: string,
  init: any,
  {
    label,
    reqId = rid(label),
    expectJson = true,
    note = {},
    filesForLog,
  }: FetchWithLogsOptions
) {
  const t0 = Date.now();
  const redactedInit = {
    ...init,
    headers: maskAuth(init?.headers),
  };

  // 업로드 파일 사이즈 메타(가능하면 계산)
  const uploadSizes = await maybeBuildUploadSizesNote(init?.body, filesForLog);

  metaLog(`[HTTP:${label}] REQUEST`, {
    reqId,
    method: init?.method || "GET",
    url,
    headers: redactedInit.headers,
    bodyType: init?.body
      ? init.body instanceof FormData
        ? "FormData"
        : typeof init.body
      : "none",
    note,
    ...(uploadSizes ? { upload: uploadSizes } : {}),
    ts: nowIso(),
  });

  let res: Response;
  let text = "";
  try {
    res = await fetch(url, init);
  } catch (e: any) {
    const elapsed = Date.now() - t0;
    metaLog(`[HTTP:${label}] NETWORK_ERROR`, {
      reqId,
      url,
      error: e?.message || String(e),
      elapsedMs: elapsed,
      ts: nowIso(),
    });
    throw e;
  }

  const elapsed = Date.now() - t0;
  const contentType = res.headers?.get?.("content-type") || "";
  try {
    text = await res.text();
  } catch (e: any) {
    metaLog(`[HTTP:${label}] READ_ERROR`, {
      reqId,
      status: res.status,
      ok: res.ok,
      contentType,
      readError: e?.message || String(e),
      elapsedMs: elapsed,
      ts: nowIso(),
    });
    throw e;
  }

  const { json, error: parseError } = expectJson
    ? safeJsonParse(text)
    : { json: null, error: null };

  const meta = {
    reqId,
    url,
    status: res.status,
    ok: res.ok,
    contentType,
    elapsedMs: elapsed,
    parsed: expectJson ? !parseError : false,
    parseError,
    rawSnippet: snip(text),
    rawLength: text?.length ?? 0,
    ts: nowIso(),
    note,
  };

  if (!res.ok) {
    metaLog(`[HTTP:${label}] ERROR_META`, meta);
  } else {
    metaLog(`[HTTP:${label}] OK_META`, meta);
  }

  return { res, text, json, meta };
}

// ==================== 메뉴 조회 ====================

export const getStoreMenus = async (
  storeId: number,
  accessToken: string
): Promise<MenuData[]> => {
  const url = `${BASE_API_URL}/menu/${storeId}`;

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
    { label: "GET_STORE_MENUS", note: { storeId } }
  );

  if (!res.ok) {
    throw new Error(text || "메뉴 조회 실패");
  }

  const { json, error } = safeJsonParse<any>(text);
  if (error) throw new Error("잘못된 응답 형식입니다.");

  const menus = json?.data?.menus || json?.menus || json?.data || [];
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
  type: "IMAGE";
  menuIds: number[];
  prompt: string;
  images: Array<{ uri: string; name?: string; type?: string } | any>;
};

export type MenuPosterResponse = {
  menuPosterId: number;
};

/**
 * 업로드 파일 사이즈를 로깅하려면 두 번째 인자로 filesForLog를 넘겨라.
 * 예) requestMenuPosterAsset(fd, { filesForLog: images })
 */
export const requestMenuPosterAsset = async (
  formData: FormData,
  opts?: { filesForLog?: Array<{ uri: string; name?: string; type?: string }> }
) => {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/assets/request`;

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData, // multipart는 Content-Type 직접 지정하지 않음
    },
    {
      label: "REQ_MENU_POSTER_ASSET",
      expectJson: true,
      note: {
        bodyType: "FormData (images[], storeId, type, menuIds[], prompt)",
      },
      filesForLog: opts?.filesForLog,
    }
  );

  const { json } = safeJsonParse<any>(text);

  if (!res.ok) {
    const errMsg =
      (json && (json.message || json.error)) || text || `HTTP ${res.status}`;
    // 스펙형 에러 출력
    specLog("[MENU_POSTER_ASSET ERROR]", {
      code:
        json?.code ||
        (res.status === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR"),
      message: errMsg,
      status: res.status,
      data: null,
      timestamp: nowIso(),
    });
    throw new Error(errMsg);
  }

  const dataObj = json?.data ?? json;

  const menuPosterId =
    typeof dataObj?.menuPosterId === "number"
      ? dataObj.menuPosterId
      : typeof dataObj?.id === "number"
      ? dataObj.id
      : NaN;

  const menuPosterAssetId =
    typeof dataObj?.menuPosterAssetId === "number"
      ? dataObj.menuPosterAssetId
      : typeof dataObj?.assetId === "number"
      ? dataObj.assetId
      : undefined;

  metaLog("[REQ_MENU_POSTER_ASSET RESULT]", {
    menuPosterId,
    menuPosterAssetId,
    ts: nowIso(),
  });

  if (!Number.isFinite(menuPosterId)) {
    console.warn("[requestMenuPosterAsset] unexpected response shape:", json);
    return { raw: json };
  }

  return { menuPosterId, menuPosterAssetId, raw: json };
};

// ==================== 포스터 생성 상태 조회 (자원: assetId) ====================

export interface MenuPosterResultResponse {
  type: string; // IMAGE 등
  assetUrl?: string;
  menuPosterAssetId?: number;
}

export async function getMenuPosterResult(
  assetId: number
): Promise<{ assetUrl?: string; type?: string } | null> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");
  if (!Number.isFinite(assetId))
    throw new Error("유효한 assetId가 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/assets/${assetId}/result`;

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    { label: "GET_ASSET_RESULT", expectJson: false, note: { assetId } }
  );

  const contentType = res.headers?.get?.("content-type") || "";

  if (!res.ok) {
    const { json } = safeJsonParse<any>(text);
    const errMsg = json?.message || text || `HTTP ${res.status}`;

    specLog("[POSTER_RESULT ERROR]", {
      code:
        json?.code ||
        (res.status === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR"),
      message: errMsg,
      status: res.status,
      data: null,
      timestamp: nowIso(),
    });
    throw new Error(errMsg);
  }

  const trimmed = (text || "").trim();
  if (!contentType.includes("application/json")) {
    if (trimmed) {
      metaLog("[GET_ASSET_RESULT READY(plain)]", {
        assetId,
        url: trimmed,
        status: res.status,
        contentType,
        ts: nowIso(),
      });
      return { assetUrl: trimmed };
    }
    metaLog("[GET_ASSET_RESULT PENDING(plain)]", {
      assetId,
      status: res.status,
      contentType,
      ts: nowIso(),
    });
    return null;
  }

  // 혹시 JSON이면 유연 처리
  const { json } = safeJsonParse<any>(text);
  const maybeUrl =
    json?.data && typeof json.data === "string"
      ? json.data
      : json?.data?.assetUrl || json?.assetUrl || json?.url;
  const maybeType = json?.data?.type || json?.type;

  if (maybeUrl) {
    metaLog("[GET_ASSET_RESULT READY(json)]", {
      assetId,
      url: maybeUrl,
      type: maybeType,
      status: res.status,
      contentType,
      ts: nowIso(),
    });
    return { assetUrl: String(maybeUrl), type: maybeType };
  }

  metaLog("[GET_ASSET_RESULT PENDING(json)]", {
    assetId,
    status: res.status,
    contentType,
    ts: nowIso(),
  });
  return null;
}

// 폴링 (assetId 기준)
export const waitForAssetReady = async (
  assetId: number,
  {
    intervalMs = 5000,
    maxWaitMs = 120000,
    onTick,
  }: {
    intervalMs?: number;
    maxWaitMs?: number;
    onTick?: (status: "READY" | "WAITING", assetUrl?: string) => void;
  } = {}
): Promise<{ assetUrl: string; assetId: number }> => {
  const started = Date.now();
  const pollId = rid("POSTER_POLL");
  let attempt = 0;
  let lastUrl: string | undefined;

  metaLog("[POSTER_POLL START]", {
    pollId,
    assetId,
    intervalMs,
    maxWaitMs,
    startedAt: new Date(started).toISOString(),
  });

  while (true) {
    attempt += 1;
    const now = Date.now();
    const elapsed = now - started;
    const remaining = Math.max(0, maxWaitMs - elapsed);

    try {
      const res = await getMenuPosterResult(assetId);
      const ready = !!res?.assetUrl;
      const changed = ready && res!.assetUrl !== lastUrl;

      if (ready) lastUrl = res!.assetUrl;

      onTick?.(ready ? "READY" : "WAITING", res?.assetUrl);

      metaLog("[POSTER_POLL TICK]", {
        pollId,
        assetId,
        attempt,
        elapsedMs: elapsed,
        remainingMs: remaining,
        nextPollInMs: ready ? 0 : intervalMs,
        status: ready ? "READY" : "WAITING",
        hasAssetUrl: !!res?.assetUrl,
        assetUrlChanged: changed || false,
        assetUrl: res?.assetUrl ? snip(res.assetUrl, 120) : undefined,
        ts: nowIso(),
      });

      if (ready) {
        metaLog("[POSTER_POLL COMPLETE]", {
          pollId,
          assetId,
          attempt,
          totalElapsedMs: elapsed,
          finalUrl: res!.assetUrl,
          ts: nowIso(),
        });
        return { assetUrl: res!.assetUrl!, assetId };
      }
    } catch (e: any) {
      metaLog("[POSTER_POLL ERROR]", {
        pollId,
        assetId,
        attempt,
        elapsedMs: elapsed,
        error: e?.message || String(e),
        nextPollInMs: intervalMs,
        ts: nowIso(),
      });
      // 계속 대기
    }

    if (elapsed >= maxWaitMs) {
      specLog("[POSTER_RESULT]", {
        code: "POSTER_GENERATION_FAILED",
        message: "포스터 생성에 실패했습니다.",
        status: 200,
        data: null,
        timestamp: nowIso(),
      });
      metaLog("[POSTER_POLL TIMEOUT]", {
        pollId,
        assetId,
        attempt,
        elapsedMs: elapsed,
        maxWaitMs,
      });
      throw new Error("메뉴포스터 생성 시간이 초과되었습니다.");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
};

// ==================== 포스터 최종 등록 ====================

export interface FinalizeMenuPosterRequest {
  menuPosterId: number;
  menuPosterAssetId: number;
  description: string;
  type: string;
}

export async function finalizeMenuPoster(
  data: FinalizeMenuPosterRequest
): Promise<ApiResponse<any>> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/finalize`;

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    {
      label: "FINALIZE_MENU_POSTER",
      note: { ...data, descriptionLen: data.description?.length },
    }
  );

  const { json, error } = safeJsonParse<ApiResponse<any>>(text);
  if (!res.ok) {
    console.error("[POST][finalizeMenuPoster] 실패", snip(text));
    throw new Error(json?.message || text || "에러 발생");
  }
  if (error || !json) throw new Error("응답 파싱 실패");

  return json;
}

// ==================== 메뉴 포스터 선물 API ====================

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

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { label: "SEND_MENU_POSTER", note: { ...payload } }
  );

  const { json, error } = safeJsonParse<SendMenuPosterResponse>(text);
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  if (error || !json) throw new Error("응답 형식이 올바르지 않습니다.");
  return json;
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

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storeId, menuPosterIds }),
    },
    { label: "ADOPT_MENU_POSTERS", note: { storeId, menuPosterIds } }
  );

  const { json } = safeJsonParse<AdoptMenuPostersResponse>(text);

  if (!res.ok) {
    throw new Error(
      (json && (json as any).message) || text || `HTTP ${res.status}`
    );
  }

  const dataObj = (json && json.data) as AdoptMenuPostersData | null;

  if (dataObj && Array.isArray(dataObj.adoptedMenuPosterIds)) {
    return dataObj;
  }

  // fallback
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

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { label: "UNADOPT_MENU_POSTER", note: { ...payload } }
  );

  const { json, error } =
    safeJsonParse<ApiResponse<UnadoptMenuPosterResponseData>>(text);

  if (!res.ok) {
    throw new Error(
      (json && (json as any).message) || text || `HTTP ${res.status}`
    );
  }

  if (error || !json) throw new Error("응답 형식이 올바르지 않습니다.");
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

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    { label: "UPDATE_ADOPTED_SORT_ORDER", note: { ...payload } }
  );

  const { json, error } =
    safeJsonParse<ApiResponse<UpdateAdoptedSortOrderResponseData>>(text);

  if (!res.ok) {
    throw new Error(
      (json && (json as any).message) || text || `HTTP ${res.status}`
    );
  }

  if (error || !json) throw new Error("응답 형식이 올바르지 않습니다.");
  return json;
}
