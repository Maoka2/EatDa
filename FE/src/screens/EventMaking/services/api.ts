import { getTokens } from "../../Login/services/tokenStorage";
import { normalizeImageForUpload } from "../../../utils/normalizeImage";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

const BASE_URL = "https://i13a609.p.ssafy.io/test";

// 이벤트 asset 파일 다운로드 시
const downloadAttempts: Record<number, number> = {};

// API에 보낼 데이터의 타입
export interface EventAssetRequestData {
  // storeId: number;
  title: string;
  startDate: string;
  endDate: string;
  prompt: string;
  type: string;
  images?: {
    uri: string;
    type: string;
    name: string;
  }[];
}

export interface ActiveEvent {
  eventId: number;
  title: string;
  startAt: string;
  endAt: string;
  postUrl: string;
  storeName: string;
  description: string;
}

// API의 공통 응답 구조 타입
export interface ApiResponse<T> {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
}

// ------------------------------
// 업로드한 파일 크기 로그 유틸
// ------------------------------
const fmtBytes = (bytes?: number | null) => {
  if (bytes == null) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

// FileSystem.getInfoAsync는 존재하지 않는 파일 케이스가 있어 size가 항상 보장되지 않음
async function statUri(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const size = (info as any).size; // 런타임에 존재하는 경우가 많아 안전 캐스팅
    return typeof size === "number" ? size : null;
  } catch {
    return null;
  }
}

async function logImageSizes(
  tag: string,
  files: { uri: string; name?: string }[]
) {
  const sizes = await Promise.all(files.map((f) => statUri(f.uri)));
  let total = 0;
  console.log(`[#${tag}] images=${files.length}`);
  files.forEach((f, i) => {
    const sz = sizes[i];
    if (typeof sz === "number") total += sz;
    console.log(
      `[#${tag}] [${i}] name=${f.name ?? "(no-name)"} size=${fmtBytes(
        sz
      )} uri=${f.uri}`
    );
  });
  console.log(`[#${tag}] total=${fmtBytes(total)}\n`);
}

export type EventAssetResp = { eventAssetId: number; eventId: number };

// 기존 함수 시그니처 변경 + 응답 파싱 보강
export const requestEventAsset = async (
  data: EventAssetRequestData
): Promise<EventAssetResp> => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("type", "IMAGE");
  fd.append("startDate", data.startDate);
  fd.append("endDate", data.endDate);
  fd.append("prompt", data.prompt);

  if (data.images?.length) {
    await logImageSizes("RAW", data.images as any);
    const normed = await Promise.all(
      data.images.map((img, i) => normalizeImageForUpload(img, i))
    );
    await logImageSizes("NORMED", normed as any);
    normed.forEach((img) => {
      fd.append("image", {
        uri: img.uri,
        type: img.type,
        name: img.name,
      } as any);
    });
    await logImageSizes("FINAL", normed as any);
  }

  console.log("🚀 API 요청 전송 직전 데이터 확인");
  console.log(JSON.stringify((fd as any)._parts, null, 2));

  const res = await fetch(`${BASE_URL}/api/events/assets/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: fd,
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("EVENT ASSET ERROR", { status: res.status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${res.status}`
    );
  }

  // ← 여기서 유연하게 파싱 (data 안/밖 모두 대응)
  const dataObj = json?.data ?? json;
  const eventAssetId =
    typeof dataObj?.eventAssetId === "number"
      ? dataObj.eventAssetId
      : typeof dataObj?.id === "number"
      ? dataObj.id
      : NaN;

  const eventId =
    typeof dataObj?.eventId === "number"
      ? dataObj.eventId
      : typeof dataObj?.event?.id === "number"
      ? dataObj.event.id
      : NaN;

  if (!Number.isFinite(eventAssetId) || !Number.isFinite(eventId)) {
    console.warn("[requestEventAsset] unexpected response shape:", json);
    throw new Error("eventId / eventAssetId 파싱 실패");
  }

  return { eventAssetId, eventId };
};

// 이벤트 asset 결과 조회
export const getEventAssetResult = async (eventAssetId: number) => {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");
  }

  const url = `${BASE_URL}/api/events/assets/${eventAssetId}/result`;

  console.log(url);
  // ── 요청 로그
  console.log(
    `[ASSET][REQ] GET ${url}\n[ASSET][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const ms = Date.now() - started;

  const status = res.status;
  const raw = await res.text();

  // JSON 파싱 (비JSON 대비)
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    // no-op
  }

  // ── 응답 로그 (성공/실패 공통)
  if (json) {
    console.log(
      `[ASSET][RES ${status}] (${ms}ms) → pretty JSON:\n${JSON.stringify(
        json,
        null,
        2
      )}`
    );
  } else {
    // JSON이 아닐 때도 보기 좋게
    const preview =
      typeof raw === "string" && raw.length > 1000
        ? raw.slice(0, 1000) + `… (truncated ${raw.length - 1000} chars)`
        : raw;
    console.log(
      `[ASSET][RES ${status}] (${ms}ms) → non-JSON body:\n${
        preview || "(empty)"
      }`
    );
  }

  if (!res.ok) {
    console.error("GET ASSET RESULT ERROR", { status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${status}`
    );
  }

  return json;
};

// 이벤트 최종 등록
export interface FinalizeEventData {
  eventId: number;
  eventAssetId: number;
  description: string;
}

export const finalizeEvent = async (data: FinalizeEventData) => {
  // 토큰 받아오기
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다. 다시 로그인 해주세요.");
  }

  const body = {
    eventId: data.eventId,
    eventAssetId: data.eventAssetId,
    description: data.description,
    type: "IMAGE",
  };

  console.log("🚀 이벤트 최종 등록 요청 데이터:", body);

  const res = await fetch(`${BASE_URL}/api/events/finalize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  if (!res.ok) {
    console.error("FINALIZE EVENT ERROR", { status: res.status, raw, json });

    throw new Error(
      (json && (json.message || json.details)) || raw || `HTTP ${res.status}`
    );
  }

  console.log("✅ 이벤트 최종 등록 성공 응답:", json);
  return json;
};

// 생성된 이벤트 asset 다운로드 API
export const downloadEventAsset = async (
  eventAssetId: number,
  opts?: {
    assetUrl?: string | null;
    cachedLocalPath?: string | null;
    preferredExt?: string | null;
  }
) => {
  // 시도 횟수 카운트
  const attempt = (downloadAttempts[eventAssetId] =
    (downloadAttempts[eventAssetId] ?? 0) + 1);
  console.log(`[DL][#${attempt}] start eventAssetId=${eventAssetId}`);

  // 갤러리 권한
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    console.warn(`[DL][#${attempt}] no-permission`);
    Alert.alert("권한 필요", "앨범에 저장하려면 접근 권한이 필요합니다.");
    return;
  }

  // 토큰
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("인증 정보가 없습니다.");

  // 확장자 추정
  const guessFromUrl =
    opts?.assetUrl
      ?.match(/\.(png|jpg|jpeg|webp)(?=($|\?))/i)?.[1]
      ?.toLowerCase() || "png";
  const ext = (opts?.preferredExt || guessFromUrl).replace(/^\./, "");
  const fileName = `event-poster-${eventAssetId}.${ext}`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  // 1) 캐시에 받은 파일이 있으면 그걸 바로 앨범으로
  if (opts?.cachedLocalPath) {
    try {
      const info = await FileSystem.getInfoAsync(opts.cachedLocalPath);
      if (info.exists) {
        console.log(
          `[DL][#${attempt}] route=cache path=${opts.cachedLocalPath}`
        );
        const asset = await MediaLibrary.createAssetAsync(opts.cachedLocalPath);
        await MediaLibrary.createAlbumAsync("EatDa", asset, false);
        Alert.alert("저장 완료", "이미지가 갤러리에 저장되었습니다.");
        return;
      } else {
        console.log(
          `[DL][#${attempt}] cache-miss path=${opts.cachedLocalPath}`
        );
      }
    } catch (e) {
      console.warn(`[DL][#${attempt}] cache-check-error`, e);
    }
  }

  // 2) assetUrl로 직접 다운로드(임시 URL 유효시간 내라면 성공)
  if (opts?.assetUrl) {
    try {
      console.log(
        `[DL][#${attempt}] route=direct url=${opts.assetUrl.slice(0, 120)}...`
      );
      const dl = await FileSystem.downloadAsync(opts.assetUrl, fileUri);
      const asset = await MediaLibrary.createAssetAsync(dl.uri);
      await MediaLibrary.createAlbumAsync("EatDa", asset, false);
      Alert.alert("저장 완료", "이미지가 갤러리에 저장되었습니다.");
      return;
    } catch (e) {
      console.warn(`[DL][#${attempt}] direct-failed, will fallback`, e);
    }
  }

  // 3) 서버 엔드포인트로 폴백 (임시 URL 만료 시 서버도 실패할 수 있음)
  const downloadUrl = `${BASE_URL}/api/events/assets/download?eventAssetId=${eventAssetId}`;
  console.log(`[DL][#${attempt}] route=endpoint preflight ${downloadUrl}`);

  try {
    const preflight = await fetch(downloadUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!preflight.ok) {
      const txt = await preflight.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(txt);
      } catch {}
      console.error(
        `[DL][#${attempt}] endpoint-preflight-fail:`,
        parsed ?? txt
      );
      const errorMessage =
        parsed?.details?.eventAssetId || parsed?.message || "오류 발생";
      Alert.alert("오류", errorMessage);
      return;
    }

    console.log(`[DL][#${attempt}] endpoint-download start`);
    const result = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const albumAsset = await MediaLibrary.createAssetAsync(result.uri);
    await MediaLibrary.createAlbumAsync("EatDa", albumAsset, false);

    console.log(`[DL][#${attempt}] endpoint-download success -> ${result.uri}`);
    Alert.alert("저장 완료", "이미지가 갤러리에 성공적으로 저장되었습니다.");
  } catch (error: any) {
    console.error(`[DL][#${attempt}] endpoint-download-error:`, error);
    Alert.alert("오류", "이미지를 저장하는 중 오류가 발생했습니다.");
  }
};

// 가게별 이벤트 조회(Active)
export const getActiveEvents = async (
  lastEventId?: number
): Promise<ActiveEvent[]> => {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다.");
  }

  const url = lastEventId
    ? `${BASE_URL}/api/events/active?lastEventId=${encodeURIComponent(
        String(lastEventId)
      )}`
    : `${BASE_URL}/api/events/active`;

  console.log(`🚀 진행 중인 이벤트 조회 요청: ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const raw = await res.text();
  let json: ApiResponse<ActiveEvent[]> | null = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    console.error("응답 JSON 파싱 실패:", raw);
    throw new Error(`응답 파싱 실패: ${raw}`);
  }

  if (!res.ok) {
    console.error("GET ACTIVE EVENTS ERROR", {
      status: res.status,
      raw,
      json,
    });
    throw new Error((json && json.message) || raw || `HTTP ${res.status}`);
  }

  console.log("✅ 진행 중인 이벤트 조회 성공:");

  return json?.data ?? [];
};

// 생성 다 되고나서 fianlize 되게끔하기

type AssetPhase = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export type WaitForAssetReadyOptions = {
  intervalMs?: number;
  maxWaitMs?: number;
  backoffFactor?: number;
  // 매 폴링마다 상태를 알려주는 로그용 콜백
  onTick?: (info: {
    status?: AssetPhase;
    posterUrl?: string;
    raw?: any;
  }) => void;
};

function parseAssetResult(json: any): {
  status?: AssetPhase;
  posterUrl?: string;
  message?: string;
  code?: string;
} {
  const code: string | undefined = json?.code;
  const d = json?.data ?? null;
  const message: string | undefined = json?.message;

  // ← 여기서 path를 최우선으로 포함
  const posterUrl: string | undefined =
    d?.path ||
    d?.assetUrl ||
    d?.posterUrl ||
    d?.url ||
    json?.path ||
    json?.assetUrl ||
    json?.posterUrl ||
    json?.url;

  let status: AssetPhase | undefined;
  if (code === "ASSET_GENERATION_SUCCESS") status = "SUCCESS";
  else if (code === "ASSET_GENERATION_PENDING") status = "PENDING";
  else if (code === "ASSET_GENERATION_FAILED") status = "FAILED";

  // (보조 매핑은 숫자 200 같은 값이 들어올 수 있으므로 문자열만 수용)
  if (!status) {
    const fallback = json?.data?.status || json?.assetStatus;
    if (
      fallback === "SUCCESS" ||
      fallback === "FAILED" ||
      fallback === "PENDING" ||
      fallback === "PROCESSING"
    ) {
      status = fallback;
    }
  }

  return { status, posterUrl, message, code };
}

function isAssetUrlRequiredError(raw: string, json: any): boolean {
  const code = json?.code || "";
  const msg = json?.message || raw || "";
  return (
    String(code).includes("ASSET_URL_REQUIRED") ||
    String(msg).includes("ASSET_URL_REQUIRED")
  );
}

/**
 * 에셋이 SUCCESS 상태가 되고 posterUrl이 실제로 채워질 때까지 기다림
 * 매 폴링마다 onTick으로 상태를 전달
 */
export async function waitForAssetReady(
  eventAssetId: number,
  opts?: WaitForAssetReadyOptions
): Promise<{ posterUrl: string }> {
  const intervalMs = opts?.intervalMs ?? 5000;
  const maxWaitMs = opts?.maxWaitMs ?? 90_000;
  const backoff = opts?.backoffFactor ?? 1.25;

  let delay = intervalMs;
  const start = Date.now();

  while (true) {
    let json: any = null;

    try {
      json = await getEventAssetResult(eventAssetId);
    } catch (e: any) {
      // 네트워크/일시 오류는 타임아웃 한도 내에서 재시도
      opts?.onTick?.({
        status: undefined,
        posterUrl: undefined,
        raw: e?.message || e,
      });
    }

    if (json) {
      const { status, posterUrl, message, code } = parseAssetResult(json);
      opts?.onTick?.({ status, posterUrl, raw: json });

      // 실패 코드 or 상태
      if (status === "FAILED" || code === "ASSET_GENERATION_FAILED") {
        throw new Error(message || "에셋 생성이 실패했습니다.");
      }

      // 성공 처리
      if (status === "SUCCESS" || code === "ASSET_GENERATION_SUCCESS") {
        if (posterUrl && posterUrl.trim().length > 0) {
          return { posterUrl };
        }
        // 성공이지만 URL 반영 지연이면 한 번 더 대기
      }

      // PENDING/PROCESSING/미정 상태 → 계속 대기
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error("에셋 생성 대기 시간이 초과되었습니다.");
    }

    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * backoff, 6000);
  }
}

// 사장님별 이벤트 조회
export const getMyEvents = async (lastEventId?: number) => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const url = lastEventId
    ? `${BASE_URL}/api/events/my?lastEventId=${lastEventId}`
    : `${BASE_URL}/api/events/my`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("GET MY EVENTS ERROR", { status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${status}`
    );
  }

  return json?.data;
};

// 이벤트 삭제
export const deleteEvent = async (eventId: number, storeId?: number) => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const idStr = encodeURIComponent(String(eventId));
  const baseUrl = `${BASE_URL}/api/events/${idStr}`;

  // 공통 호출 함수 (로깅 + 유연 파싱)
  const callDelete = async (url: string) => {
    console.log("=== [DELETE EVENT] 요청 ===");
    console.log(`DELETE ${url}`);
    console.log(`Authorization: Bearer ****(len=${accessToken.length})`);

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // ⚠️ 바디 없음 → Content-Type 생략 (서버에 혼란 주지 않도록)
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // 문자열 응답 대비
    }

    console.log("=== [DELETE EVENT] 응답 ===");
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(text || "(empty)");
    }

    return { res, data, text };
  };

  // 1차 호출
  let { res, data, text } = await callDelete(baseUrl);

  // 404면 storeId 쿼리로 1회 리트라이 (서버가 스토어 스코프를 요구하는 케이스 방지)
  if (res.status === 404 && typeof storeId === "number") {
    const retryUrl = `${baseUrl}?storeId=${encodeURIComponent(
      String(storeId)
    )}`;
    console.log("[DELETE RETRY] status 404 → retry with storeId:", retryUrl);
    ({ res, data, text } = await callDelete(retryUrl));
  }

  // 에러 매핑
  if (!res.ok) {
    const status = res.status;
    const code = data?.code;
    let msg = data?.message || text || `HTTP ${status}`;
    if (status === 401) msg = "인증이 필요합니다.";
    else if (status === 403) msg = "삭제 권한이 없습니다.";
    else if (status === 404) msg = "이벤트를 찾을 수 없습니다.";

    const err: any = new Error(msg);
    err.status = status;
    err.code = code;
    throw err;
  }

  // 응답 정규화: 서버가 string/JSON 혼용해도 message를 만들어 돌려줌
  const message =
    data?.message ||
    (typeof text === "string" && text.trim().length > 0
      ? text
      : "이벤트가 삭제되었습니다.");

  return { status: res.status, message, raw: data ?? text };
};

// 해당 가게 전체 이벤트 조회
export const getStoreEvents = async (
  storeId: number
): Promise<ActiveEvent[]> => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");
  if (!storeId || storeId <= 0) throw new Error("유효하지 않은 가게 ID입니다.");

  const url = `${BASE_URL}/api/events?storeId=${encodeURIComponent(
    String(storeId)
  )}`;
  console.log(`[getStoreEvents] GET ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    console.error("[getStoreEvents] JSON 파싱 실패:", raw);
    throw new Error("응답 파싱 실패");
  }

  if (!res.ok) {
    const msg = json?.message || raw || `HTTP ${res.status}`;
    console.error("[getStoreEvents] 서버 오류:", msg);
    throw new Error(msg);
  }

  // 스웨거 응답: { code, message, status, data: [ {title, description, startDate, endDate, imageUrl} ] }
  const arr: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.events)
    ? json.events
    : Array.isArray(json)
    ? json
    : [];

  const mapped: ActiveEvent[] = arr.map((e: any, idx: number) => ({
    eventId:
      typeof e?.eventId === "number"
        ? e.eventId
        : typeof e?.id === "number"
        ? e.id
        : Number(`${storeId}${idx}`),

    title: String(e?.title ?? ""),
    startAt: String(e?.startAt ?? e?.startDate ?? ""),
    endAt: String(e?.endAt ?? e?.endDate ?? ""),
    postUrl:
      typeof e?.postUrl === "string"
        ? e.postUrl
        : typeof e?.imageUrl === "string"
        ? e.imageUrl
        : "", // 이미지 URL로 대체
    storeName: String(e?.storeName ?? ""),
    description: String(e?.description ?? ""),
  }));

  console.log("[getStoreEvents] mapped length:", mapped.length);
  if (mapped[0]) console.log("[getStoreEvents] first mapped:", mapped[0]);

  return mapped;
};
