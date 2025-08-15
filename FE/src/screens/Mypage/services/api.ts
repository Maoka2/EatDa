import { getTokens } from "../../Login/services/tokenStorage";

const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test"; // 필요 없으면 "" 로!
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

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
// ====================================================== //

// Eater 마이페이지 상단 정보 조회용
export interface UserStats {
  reviewCount: number;
  scrapCount: number;
  menuPosterCount: number;
}

function extractUserStatsFromAny(json: any): UserStats {
  const data = json?.data ?? json;
  return {
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

  // ── 요청 로그
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
  } catch {
    // JSON 아님 → 그대로 에러 메시지 구성
  }

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

  // ★ 응답 전체 구조 확인용 로그 추가
  console.log("[USER-STATS][RAW-JSON]", JSON.stringify(json, null, 2));

  return extractUserStatsFromAny(json);
}

// Maker 마이페이지 상단 정보 조회용

export interface MakerStats {
  reviewCount: number; // = countReceivedReviews
  eventCount: number; // = countEvents
  menuPosterCount: number; // = countMenuPosters
}

function extractMakerStatsStrict(json: any): MakerStats {
  const d = json?.data ?? json ?? {};
  return {
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

// 내 가게 리뷰 조회(Eater -> Maker)
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

  // 요청 로그
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
  } catch {
    // JSON 아니어도 에러 처리 위해 그대로 둠
  }

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
      const uri = r.shortsUrl || r.imageUrl || "";
      if (!uri) return null; // 표시할 미디어가 없으면 스킵
      return {
        id: `${uri}#${idx}`,
        type: r.shortsUrl ? "video" : "image",
        uri,
        title: titleFallback,
        description: r.description ?? "",
        likes: 0,
        views: 0,
        thumbnail: r.thumbnailUrl ?? null,
      };
    })
    .filter(Boolean) as ReviewGridItem[];
}

// 내가 스크랩한 리뷰 조회

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

  // ── 요청 로그
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

// ============ 그리드용 매퍼 (ReviewItem으로 변환) ============

export function mapScrapsToGridItems(
  list: ScrappedReview[],
  titleFallback = "스크랩 리뷰"
): ReviewGridItem[] {
  return list
    .map((r, idx) => {
      const uri = r.shortsUrl || r.imageUrl || "";
      if (!uri) return null;
      return {
        id: `${uri}#${idx}`,
        type: r.shortsUrl ? "video" : "image",
        uri,
        title: r.storeName || titleFallback,
        description: r.description ?? "",
        thumbnail: r.thumbnailUrl ?? null,
      };
    })
    .filter(Boolean) as ReviewGridItem[];
}

// 리뷰 삭제(Eater 본인이 작성한 자신의 리뷰를 삭제)

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

  // ── 요청 로그
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
    // 204인 경우 본문이 없으므로 JSON 파싱에서 에러가 날 수 있음
    if (raw && raw.trim().length > 0) {
      json = JSON.parse(raw);
    }
  } catch {
    // JSON 아님 → 아래 공통 에러 처리로 진행
  }

  // ── 상태별 처리
  if (!res.ok) {
    // 명세 매핑: 401/403/404
    if (status === 401) {
      throw new Error("로그인이 필요합니다.");
    }
    if (status === 403) {
      throw new Error("접근 권한이 없습니다.");
    }
    if (status === 404) {
      throw new Error("해당 리뷰를 찾을 수 없습니다.");
    }

    // 기타 서버 오류
    const msg =
      (json && (json.message || json.error)) ||
      (raw && raw.trim().length > 0 ? raw : `HTTP ${status}`);
    console.error("[REVIEW-DEL][ERR]", { status, raw });
    throw new Error(msg);
  }

  const elapsed = Date.now() - started;

  // 정상 케이스
  // 1) 사양대로 200 + ApiEnvelope<null> 본문
  if (status === 200 && json) {
    console.log(`[REVIEW-DEL][RES] ${status} in ${elapsed}ms`);
    return json as DeleteReviewResult;
  }

  // 2) 혹시 204(No Content)로 내려오는 백엔드도 호환
  //    클라이언트에서 명세 형태로 결과를 합성해서 리턴
  if (status === 204) {
    console.log(`[REVIEW-DEL][RES] ${status} in ${elapsed}ms (no content)`);
    return {
      code: "REVIEW_DELETED",
      message: "리뷰가 성공적으로 삭제되었습니다.",
      status: 200, // 명세의 성공 status를 따름
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  // 그 외 2xx지만 예상치 못한 형태
  console.warn("[REVIEW-DEL][WARN] Unexpected success shape", { status, raw });
  return {
    code: "REVIEW_DELETED",
    message: "리뷰가 성공적으로 삭제되었습니다.",
    status: status,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

// 내가 쓴 리뷰 목록 조회(Eater 마이페이지)
export interface MyReviewApi {
  reviewId: number;
  storeName: string;
  description: string;
  menuNames: string[]; // 예: ["양념치킨", "콜라"]
  imageUrl: string | null;
  shortsUrl: string | null;
  createdAt: string; // ISO
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
    createdAt: r?.createdAt ?? "",
  }));
}

export async function getMyReviews(params?: {
  lastReviewId?: number;
  pageSize?: number; // 사용해도 되고
  size?: number; // 서버가 size를 기대하면 이걸로
}): Promise<MyReviewApi[]> {
  const lastReviewId =
    typeof params?.lastReviewId === "number" &&
    Number.isFinite(params.lastReviewId)
      ? params.lastReviewId
      : undefined;

  // pageSize/size 둘 다 받되, 서버엔 size로 보냄
  const size =
    typeof params?.size === "number" && Number.isFinite(params.size)
      ? params.size
      : typeof params?.pageSize === "number" && Number.isFinite(params.pageSize)
      ? params.pageSize
      : undefined;

  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");

  const qs = buildQuery({ lastReviewId, size }); // ← key를 size로 통일
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

/** ========== MypageGridComponent용 매핑 (ReviewItem) ========== */
export type ReviewItemForGrid = {
  id: string;
  type: "image" | "video";
  uri: string;
  title: string; // 가게명
  description: string; // 설명 + (메뉴)
  // likes/views 등 필요시 옵션으로 추가
};

export function mapMyReviewsToReviewItems(
  list: MyReviewApi[]
): ReviewItemForGrid[] {
  return list
    .map((r) => {
      const uri = r.shortsUrl || r.imageUrl || "";
      if (!uri) return null;
      const menus = r.menuNames?.length
        ? ` · 메뉴: ${r.menuNames.join(", ")}`
        : "";
      return {
        id: String(r.reviewId),
        type: r.shortsUrl ? "video" : "image",
        uri,
        title: r.storeName || "내 리뷰",
        description: `${r.description || ""}${menus}`,
      };
    })
    .filter(Boolean) as ReviewItemForGrid[];
}
