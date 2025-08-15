import { getTokens } from "../../../Login/services/tokenStorage";
import * as FileSystem from "expo-file-system";

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
  expectJson?: boolean;
  note?: AnyObj;
  filesForLog?: Array<{ uri: string; name?: string; type?: string }>;
};

async function maybeBuildUploadSizesNote(
  body: any,
  filesForLog?: Array<{ uri: string; name?: string; type?: string }>
) {
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
  menuPosterId?: number;
  menuPosterAssetId?: number;
  raw?: any;
};

export const requestMenuPosterAsset = async (
  formData: FormData,
  opts?: { filesForLog?: Array<{ uri: string; name?: string; type?: string }> }
): Promise<MenuPosterResponse> => {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/assets/request`;

  const { res, text } = await fetchWithLogs(
    url,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
    {
      label: "REQ_MENU_POSTER_ASSET",
      expectJson: true,
      note: {
        bodyType: "FormData (image[], storeId, type, menuIds[], prompt)",
      },
      filesForLog: opts?.filesForLog,
    }
  );

  const { json } = safeJsonParse<any>(text);

  if (!res.ok) {
    const errMsg =
      (json && (json.message || json.error)) || text || `HTTP ${res.status}`;
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

  // ★★★ 핵심: BE가 menuPosterId 이름으로 assetId를 보내는 현실까지 포함해 추론
  const assetIdGuessed =
    (typeof dataObj?.menuPosterAssetId === "number" &&
      dataObj.menuPosterAssetId) ||
    (typeof dataObj?.assetId === "number" && dataObj.assetId) ||
    (typeof dataObj?.menuPosterId === "number" && dataObj.menuPosterId) ||
    undefined;

  const posterIdGuessed =
    (typeof dataObj?.realMenuPosterId === "number" &&
      dataObj.realMenuPosterId) ||
    (typeof dataObj?.menuPosterIdReal === "number" &&
      dataObj.menuPosterIdReal) ||
    undefined;

  metaLog("[REQ_MENU_POSTER_ASSET RESULT]", {
    menuPosterId: posterIdGuessed,
    menuPosterAssetId: assetIdGuessed,
    ts: nowIso(),
  });

  return {
    menuPosterId: posterIdGuessed,
    menuPosterAssetId: assetIdGuessed,
    raw: json,
  };
};

export async function peekMenuPosterAssetId(
  menuPosterId: number
): Promise<number | null> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증이 필요합니다.");
  if (!Number.isFinite(menuPosterId))
    throw new Error("유효한 menuPosterId가 필요합니다.");

  const url = `${BASE_API_URL}/menu-posters/${menuPosterId}`;

  const { res, text } = await fetchWithLogs(
    url,
    { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } },
    {
      label: "GET_MENU_POSTER_DETAIL",
      expectJson: true,
      note: { menuPosterId },
    }
  );

  const { json } = safeJsonParse<any>(text);

  if (!res.ok) {
    const parsed = safeJsonParse<any>(text).json;
    const msg =
      (parsed && (parsed.message || parsed.error)) ||
      text ||
      `HTTP ${res.status}`;

    if (res.status === 401 || res.status === 403) {
      const err: any = new Error(msg);
      err.status = res.status;
      err.url = url;
      throw err;
    }

    console.info("[PEEK_ASSET_ID NON_OK]", {
      status: res.status,
      url,
      snippet: snip(text),
    });
    return null;
  }

  const d = (json && (json.data ?? json)) || {};

  const candidates = [
    d?.menuPosterAssetId,
    d?.assetId,
    d?.asset?.id,
    d?.menuPosterAsset?.id,
    Array.isArray(d?.assets) ? d.assets[0]?.id : undefined,
  ];
  const found = candidates.find((v) => typeof v === "number");
  return typeof found === "number" ? (found as number) : null;
}

export async function waitForAssetIdByMenuPoster(
  menuPosterId: number,
  {
    intervalMs = 5000,
    maxWaitMs = 120000,
    onTick,
  }: {
    intervalMs?: number;
    maxWaitMs?: number;
    onTick?: (status: "FOUND" | "WAITING", assetId?: number) => void;
  } = {}
): Promise<number> {
  const started = Date.now();
  const pollId = rid("ASSETID_POLL");
  let attempt = 0;

  metaLog("[ASSETID_POLL START]", {
    pollId,
    menuPosterId,
    intervalMs,
    maxWaitMs,
    startedAt: nowIso(),
  });

  while (true) {
    attempt += 1;
    const elapsed = Date.now() - started;
    const remaining = Math.max(0, maxWaitMs - elapsed);

    try {
      const assetId = await peekMenuPosterAssetId(menuPosterId);
      const found = typeof assetId === "number" && Number.isFinite(assetId);
      onTick?.(found ? "FOUND" : "WAITING", assetId || undefined);

      metaLog("[ASSETID_POLL TICK]", {
        pollId,
        menuPosterId,
        attempt,
        elapsedMs: elapsed,
        remainingMs: remaining,
        status: found ? "FOUND" : "WAITING",
        assetId,
        nextPollInMs: found ? 0 : intervalMs,
        ts: nowIso(),
      });

      if (found) {
        metaLog("[ASSETID_POLL COMPLETE]", {
          pollId,
          menuPosterId,
          assetId,
          totalElapsedMs: elapsed,
          ts: nowIso(),
        });
        return assetId!;
      }
    } catch (e: any) {
      metaLog("[ASSETID_POLL ERROR]", {
        pollId,
        menuPosterId,
        attempt,
        elapsedMs: elapsed,
        status: e?.status,
        error: e?.message || String(e),
        nextPollInMs: intervalMs,
        ts: nowIso(),
      });
      if (e?.status === 401 || e?.status === 403) throw e;
    }

    if (elapsed >= maxWaitMs) {
      throw new Error("assetId 배정 대기 시간이 초과되었습니다.");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// ==================== 포스터 생성 상태 조회 (자원: assetId) ====================

export interface MenuPosterResultResponse {
  type: string;
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
    { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } },
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

  // text/plain인 경우: 바로 URL 문자열일 수 있음
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

  // JSON인 경우: data.path / data.assetUrl / data.url 등 폭넓게 수용
  const { json } = safeJsonParse<any>(text);
  const d = json?.data;

  const pickUrl =
    (typeof d === "string" && d) ||
    d?.assetUrl ||
    d?.url ||
    d?.path || // ★ 서버가 주는 키
    json?.assetUrl ||
    json?.url ||
    json?.path ||
    undefined;

  const makeAbsolute = (u?: string) =>
    u && /^https?:\/\//i.test(u) ? u : u ? `${BASE_HOST}${u}` : undefined;

  const finalUrl = makeAbsolute(
    typeof pickUrl === "string" ? pickUrl : undefined
  );
  const maybeType = (d && d.type) || json?.type;

  if (finalUrl) {
    metaLog("[GET_ASSET_RESULT READY(json)]", {
      assetId,
      url: finalUrl,
      type: maybeType,
      status: res.status,
      contentType,
      ts: nowIso(),
    });
    return { assetUrl: finalUrl, type: maybeType };
  }

  metaLog("[GET_ASSET_RESULT PENDING(json)]", {
    assetId,
    status: res.status,
    contentType,
    ts: nowIso(),
  });
  return null;
}

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
  menuPosterIds: number[];
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
