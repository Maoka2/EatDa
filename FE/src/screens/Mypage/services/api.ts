// src/screens/Mypage/services/api.ts
import { getTokens } from "../../Login/services/tokenStorage";
import { normalizePosterUrl } from "../../../utils/normalizeImage";

const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test";
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

// ✅ HTTP 플레이스홀더(확실히 보이는 이미지, 외부 CDN)
const PLACEHOLDER_THUMB =
  "https://dummyimage.com/600x600/eeeeee/aaaaaa.png&text=%20";

export interface ApiEnvelope<T> {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
}

// 쿼리스트링 빌드 유틸함수
function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return "";
  const parts: string[] = [];
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && String(v).length > 0) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  });
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * ✅ 미디어 URL 정규화
 * - data: 스킴 그대로 통과(그리드에서 최종 필터)
 * - http(s): 그대로 통과
 * - /로 시작하는 상대경로: BASE_HOST 붙이기
 * - 그 외 상대경로: BASE_HOST + "/" + path
 */
function normalizeMediaUrl(s: string): string {
  if (!s) return "";
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${BASE_HOST}${s}`;
  return `${BASE_HOST}/${s}`;
}

/* =========================
 *  Eater 마이페이지 상단 정보
 * ========================= */
export interface UserStats {
  nickname: string;
  reviewCount: number;
  scrapCount: number;
  menuPosterCount: number;
}

function extractUserStatsFromAny(json: any): UserStats {
  const data = json?.data ?? json;
  return {
    nickname: String(data?.nickname ?? "사용자"),
    reviewCount: Number(data?.reviewCount ?? data?.countReview ?? 0),
    scrapCount: Number(data?.scrapCount ?? data?.countScrapReview ?? 0),
    menuPosterCount: Number(data?.menuPosterCount ?? data?.countMenuPost ?? 0),
  };
}

export async function getMyUserStats(params?: {
  since?: string;
}): Promise<UserStats> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({ since: params?.since });
  const url = `${BASE_API_URL}/eaters/me${qs}`;

  console.log(`[USER-STATS][REQ] GET ${url}`);
  console.log(
    `[USER-STATS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    if (status === 401) throw new Error("인증이 필요합니다.");
    if (status === 400) {
      const msg =
        (json && (json.message || json.error)) ||
        "요청 파라미터가 올바르지 않습니다.";
      throw new Error(msg);
    }
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    console.error("[USER-STATS][ERR]", { status, raw });
    throw new Error(msg);
  }

  const elapsed = Date.now() - started;
  console.log(`[USER-STATS][RES] ${status} in ${elapsed}ms`);
  console.log("[USER-STATS][RAW-JSON]", JSON.stringify(json, null, 2));

  return extractUserStatsFromAny(json);
}

/* =========================
 *  Maker 마이페이지 상단 정보
 * ========================= */
export interface MakerStats {
  storeId: number;
  storeName: string;
  reviewCount: number; // = countReceivedReviews
  eventCount: number; // = countEvents
  menuPosterCount: number; // = countMenuPosters
}

function extractMakerStatsStrict(json: any): MakerStats {
  const d = json?.data ?? json ?? {};
  return {
    storeId: Number(d?.storeId ?? 0),
    storeName: String(d?.storeName ?? "가게 이름 없음"),
    reviewCount: Number(d?.countReceivedReviews ?? 0),
    eventCount: Number(d?.countEvents ?? 0),
    menuPosterCount: Number(d?.countMenuPosters ?? 0),
  };
}

export async function getMyMakerStats(params?: {
  since?: string;
}): Promise<MakerStats> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({ since: params?.since });
  const url = `${BASE_API_URL}/makers/me${qs}`;

  console.log(`[MAKER-STATS][REQ] GET ${url}`);
  console.log(
    `[MAKER-STATS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    if (status === 401) throw new Error("인증이 필요합니다.");
    if (status === 400) {
      const msg =
        (json && (json.message || json.error)) ||
        "요청 파라미터가 올바르지 않습니다.";
      throw new Error(msg);
    }
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    console.error("[MAKER-STATS][ERR]", { status, raw });
    throw new Error(msg);
  }

  console.log(`[MAKER-STATS][RES] ${status} in ${Date.now() - started}ms`);
  console.log("[MAKER-STATS][RAW-JSON]", JSON.stringify(json, null, 2));

  return extractMakerStatsStrict(json);
}

/* =========================
 *  Maker: 내 가게 리뷰(받은 리뷰)
 * ========================= */
export interface ReceivedReview {
  description: string;
  imageUrl: string | null;
  shortsUrl: string | null;
  thumbnailUrl: string | null;
}

function extractReviewsFromAny(json: any): ReceivedReview[] {
  const data = json?.data ?? json;
  if (!Array.isArray(data)) return [];
  return data.map((r: any) => ({
    description: r?.description ?? "",
    imageUrl: r?.imageUrl ?? null,
    shortsUrl: r?.shortsUrl ?? null,
    thumbnailUrl: r?.thumbnailUrl ?? null,
  }));
}

export async function getReceivedReviews(params?: {
  lastReviewId?: number;
  size?: number;
}): Promise<ReceivedReview[]> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({
    lastReviewId: params?.lastReviewId,
    size: params?.size,
  });

  const url = `${BASE_API_URL}/reviews/received${qs}`;

  console.log(`[REVIEWS][REQ] GET ${url}`);
  console.log(
    `[REVIEWS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("[REVIEWS][ERR]", { status, raw });
    const message =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    throw new Error(message);
  }

  const elapsed = Date.now() - started;
  const reviews = extractReviewsFromAny(json);
  console.log(
    `[REVIEWS][RES] ${status} in ${elapsed}ms, count=${reviews.length}`
  );

  return reviews;
}

/* =========================
 *  공용 그리드 아이템 타입/매퍼
 * ========================= */
export type ReviewGridItem = {
  id: string;
  type: "image" | "video";
  uri: string;
  title: string;
  description: string;
  likes?: number;
  views?: number;
  thumbnail?: string | null;
};

export function mapReviewsToGridItems(
  list: ReceivedReview[],
  titleFallback = "리뷰"
): ReviewGridItem[] {
  return list
    .map((r, idx) => {
      const rawUri = r.shortsUrl || r.imageUrl || "";
      const uri = normalizeMediaUrl(rawUri);
      if (!uri) return null;
      const isVideo = !!r.shortsUrl;

      const normalizedThumb = normalizeMediaUrl(r.thumbnailUrl || "");
      const normalizedImage = normalizeMediaUrl(r.imageUrl || "");

      return {
        id: `${uri}#${idx}`,
        type: isVideo ? "video" : "image",
        uri,
        title: titleFallback,
        description: r.description ?? "",
        likes: 0,
        views: 0,
        thumbnail: isVideo
          ? normalizedThumb || normalizedImage || PLACEHOLDER_THUMB
          : normalizedImage || PLACEHOLDER_THUMB,
      };
    })
    .filter(Boolean) as ReviewGridItem[];
}

/* =========================
 *  내가 스크랩한 리뷰
 * ========================= */
export interface ScrappedReview {
  storeName: string;
  description: string;
  imageUrl: string | null;
  shortsUrl: string | null;
  thumbnailUrl: string | null;
}

function extractScrapsFromAny(json: any): ScrappedReview[] {
  const data = json?.data ?? json;
  if (!Array.isArray(data)) return [];
  return data.map((r: any) => ({
    storeName: r?.storeName ?? "",
    description: r?.description ?? "",
    imageUrl: r?.imageUrl ?? null,
    shortsUrl: r?.shortsUrl ?? null,
    thumbnailUrl: r?.thumbnailUrl ?? null,
  }));
}

export async function getScrappedReviews(params?: {
  lastReviewId?: number;
  size?: number;
}): Promise<ScrappedReview[]> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({
    lastReviewId: params?.lastReviewId,
    size: params?.size,
  });

  const url = `${BASE_API_URL}/reviews/scraps${qs}`;

  console.log(`[SCRAPS][REQ] GET ${url}`);
  console.log(
    `[SCRAPS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("[SCRAPS][ERR]", { status, raw });
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    throw new Error(msg);
  }

  const items = extractScrapsFromAny(json);
  console.log(
    `[SCRAPS][RES] ${status} in ${Date.now() - started}ms, count=${
      items.length
    }`
  );

  return items;
}

export function mapScrapsToGridItems(
  list: ScrappedReview[],
  titleFallback = "스크랩 리뷰"
): ReviewGridItem[] {
  return list
    .map((r, idx) => {
      const rawImg = r.imageUrl || "";
      const rawVid = r.shortsUrl || "";
      const img = normalizeMediaUrl(rawImg);
      const vid = normalizeMediaUrl(rawVid);
      const isVideo = !!r.shortsUrl;

      const uri = isVideo ? vid : img;
      if (!uri) return null;

      const normalizedThumb = normalizeMediaUrl(r.thumbnailUrl || "");

      return {
        id: `${uri}#${idx}`,
        type: isVideo ? "video" : "image",
        uri,
        title: r.storeName || titleFallback,
        description: r.description ?? "",
        thumbnail: isVideo
          ? normalizedThumb || img || PLACEHOLDER_THUMB
          : img || PLACEHOLDER_THUMB,
      };
    })
    .filter(Boolean) as ReviewGridItem[];
}

/* =========================
 *  내가 쓴 리뷰 목록 조회(Eater)
 * ========================= */
export interface MyReviewApi {
  reviewId: number;
  storeName: string;
  description: string;
  menuNames: string[];
  imageUrl: string | null;
  shortsUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

function extractMyReviewsFromAny(json: any): MyReviewApi[] {
  const data = json?.data ?? json;

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.reviews)
    ? data.reviews
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return list.map((r: any) => ({
    reviewId: Number(r?.reviewId ?? r?.id),
    storeName: r?.storeName ?? "",
    description: r?.description ?? "",
    menuNames: Array.isArray(r?.menuNames) ? r.menuNames : [],
    imageUrl: r?.imageUrl ?? null,
    shortsUrl: r?.shortsUrl ?? null,
    thumbnailUrl: r?.thumbnailUrl ?? null,
    createdAt: r?.createdAt ?? "",
  }));
}

export async function getMyReviews(params?: {
  lastReviewId?: number;
  pageSize?: number;
  size?: number;
}): Promise<MyReviewApi[]> {
  const lastReviewId =
    typeof params?.lastReviewId === "number" &&
    Number.isFinite(params.lastReviewId)
      ? params.lastReviewId
      : undefined;

  const size =
    typeof params?.size === "number" && Number.isFinite(params.size)
      ? params.size
      : typeof params?.pageSize === "number" && Number.isFinite(params.pageSize)
      ? params.pageSize
      : undefined;

  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({ lastReviewId, size });
  const url = `${BASE_API_URL}/reviews/me${qs}`;

  console.log(`[MYREVIEWS][REQ] GET ${url}`);
  console.log(
    `[MYREVIEWS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("[MYREVIEWS][ERR]", { status, raw });
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    throw new Error(msg);
  }

  const items = extractMyReviewsFromAny(json);
  console.log(
    `[MYREVIEWS][RES] ${status} in ${Date.now() - started}ms, count=${
      items.length
    }`
  );
  return items;
}

// ✅ thumbnail 필드만 추가 (타입 변경)
export type ReviewItemForGrid = {
  id: string;
  type: "image" | "video";
  uri: string;
  title: string;
  description: string;
  thumbnail?: string;
};

export function mapMyReviewsToReviewItems(
  list: MyReviewApi[]
): ReviewItemForGrid[] {
  return list
    .map((r) => {
      const uri = r.shortsUrl || r.imageUrl || "";
      if (!uri) return null;
      const isVideo = !!r.shortsUrl;
      const menus = r.menuNames?.length
        ? ` · 메뉴: ${r.menuNames.join(", ")}`
        : "";
      return {
        id: String(r.reviewId),
        type: isVideo ? "video" : "image",
        uri,
        title: r.storeName || "내 리뷰",
        description: `${r.description || ""}${menus}`,
        thumbnail: isVideo
          ? r.thumbnailUrl || r.imageUrl || PLACEHOLDER_THUMB
          : r.imageUrl || PLACEHOLDER_THUMB,
      };
    })
    .filter(Boolean) as ReviewItemForGrid[];
}

/* =========================
 *  내가 만든(선물한) 메뉴판 조회(Eater)
 * ========================= */
export interface MyMenuPoster {
  id: number;
  imageUrl: string;
}

function extractMyMenuPostersFromAny(json: any): MyMenuPoster[] {
  const data = json?.data ?? json;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.posters)
    ? data.posters
    : [];

  return list
    .map((it: any) => {
      const id = Number(it?.id ?? it?.menuPosterId ?? it?.posterId);
      const imageUrl = normalizePosterUrl(
        String(it?.imageUrl ?? it?.url ?? it?.path ?? "")
      );
      return { id, imageUrl };
    })
    .filter((p: MyMenuPoster) => Number.isFinite(p.id) && !!p.imageUrl);
}

export async function getMyMenuPosters(): Promise<MyMenuPoster[]> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const url = `${BASE_API_URL}/menu-posters/my`;

  console.log(`[MY-POSTERS][REQ] GET ${url}`);
  console.log(
    `[MY-POSTERS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    console.error("[MY-POSTERS][ERR]", { status, raw });
    throw new Error(msg);
  }

  const elapsed = Date.now() - started;
  console.log(`[MY-POSTERS][RES] ${status} in ${elapsed}ms`);
  console.log("[MY-POSTERS][RAW-JSON]", JSON.stringify(json, null, 2));

  return extractMyMenuPostersFromAny(json);
}

export function mapMenuPostersToGridItems(
  posters: MyMenuPoster[],
  titleFallback = "내 메뉴판"
): ReviewGridItem[] {
  return posters.map((p) => ({
    id: String(p.id),
    type: "image",
    uri: p.imageUrl,
    title: titleFallback,
    description: "",
    thumbnail: p.imageUrl || PLACEHOLDER_THUMB,
  }));
}

/* =========================
 *  Maker가 '선물 받은' 메뉴판 조회
 * ========================= */
export type ReceivedMenuPoster = {
  id: number;
  type?: "IMAGE" | "VIDEO" | string;
  imageUrl?: string | null;
  path?: string | null;
  createdAt?: string;
};

function toReceivedMenuPoster(raw: any): ReceivedMenuPoster | null {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.menuPosterId ?? raw.id ?? raw.posterId ?? null;
  const src = raw.path ?? raw.imageUrl ?? raw.url ?? null;
  if (!id) return null;

  return {
    id: Number(id),
    type: typeof raw.type === "string" ? raw.type : undefined,
    imageUrl: typeof src === "string" && src.length > 0 ? src : null,
    path: typeof raw.path === "string" ? raw.path : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

export function extractReceivedMenuPostersFromAny(
  json: any
): ReceivedMenuPoster[] {
  const arr: any[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];

  const normalized = arr
    .map(toReceivedMenuPoster)
    .filter((v): v is ReceivedMenuPoster => !!v);

  console.log("[RCV-POSTERS][PARSED]", {
    totalRaw: Array.isArray(arr) ? arr.length : 0,
    totalParsed: normalized.length,
    sample: normalized[0],
  });

  return normalized;
}

export async function getReceivedMenuPosters(): Promise<ReceivedMenuPoster[]> {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const url = `${BASE_API_URL}/menu-posters/received`;

  console.log(`[RCV-POSTERS][REQ] GET ${url}`);
  console.log(
    `[RCV-POSTERS][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("[RCV-POSTERS][ERR]", { status, raw });
    const msg =
      (json && (json.message || json.error)) || raw || `HTTP ${status}`;
    throw new Error(msg);
  }

  console.log(`[RCV-POSTERS][RES] ${status} in ${Date.now() - started}ms`);
  console.log("[RCV-POSTERS][RAW-JSON]", JSON.stringify(json, null, 2));

  return extractReceivedMenuPostersFromAny(json);
}

// 그리드 매핑 (path/imageUrl 둘 다 허용)
export function mapReceivedPostersToGridItems(
  posters: ReceivedMenuPoster[],
  titleFallback = "받은 메뉴판"
) {
  return posters
    .map((p): ReviewGridItem | null => {
      const srcRaw = p.imageUrl ?? p.path ?? null;
      const src = normalizeMediaUrl(srcRaw || "");
      if (!src) return null;

      const type: "image" | "video" =
        p.type === "VIDEO" || p.type === "video" ? "video" : "image";

      const item: ReviewGridItem = {
        id: String(p.id),
        type,
        uri: src,
        title: titleFallback,
        description: "",
        thumbnail: src,
      };
      return item;
    })
    .filter((x): x is ReviewGridItem => x !== null);
}

/* =========================
 *  리뷰 삭제(Eater 본인이 작성한 자신의 리뷰를 삭제)
 * ========================= */

export type DeleteReviewResult = ApiEnvelope<null>;

function _isValidPositiveInt(n: unknown) {
  if (typeof n !== "number") return false;
  if (!Number.isFinite(n)) return false;
  if (n <= 0) return false;
  return true;
}

export async function deleteMyReview(
  reviewId: number
): Promise<DeleteReviewResult> {
  if (!_isValidPositiveInt(reviewId)) {
    throw new Error("유효한 reviewId가 아닙니다.");
  }

  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");
  }

  const url = `${BASE_API_URL}/reviews/${encodeURIComponent(String(reviewId))}`;

  console.log(`[REVIEW-DEL][REQ] DELETE ${url}`);
  console.log(
    `[REVIEW-DEL][REQ] Authorization: Bearer ****(len=${accessToken.length})`
  );

  const started = Date.now();
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const status = res.status;
  const raw = await res.text();

  let json: any = null;
  try {
    if (raw && raw.trim().length > 0) {
      json = JSON.parse(raw);
    }
  } catch {}

  if (!res.ok) {
    if (status === 401) {
      throw new Error("로그인이 필요합니다.");
    }
    if (status === 403) {
      throw new Error("접근 권한이 없습니다.");
    }
    if (status === 404) {
      throw new Error("해당 리뷰를 찾을 수 없습니다.");
    }

    const msg =
      (json && (json.message || json.error)) ||
      (raw && raw.trim().length > 0 ? raw : `HTTP ${status}`);
    console.error("[REVIEW-DEL][ERR]", { status, raw });
    throw new Error(msg);
  }

  const elapsed = Date.now() - started;

  if (status === 200 && json) {
    console.log(`[REVIEW-DEL][RES] ${status} in ${elapsed}ms`);
    return json as DeleteReviewResult;
  }

  if (status === 204) {
    console.log(`[REVIEW-DEL][RES] ${status} in ${elapsed}ms (no content)`);
    return {
      code: "REVIEW_DELETED",
      message: "리뷰가 성공적으로 삭제되었습니다.",
      status: 200,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  console.warn("[REVIEW-DEL][WARN] Unexpected success shape", { status, raw });
  return {
    code: "REVIEW_DELETED",
    message: "리뷰가 성공적으로 삭제되었습니다.",
    status,
    data: null,
    timestamp: new Date().toISOString(),
  };
}
