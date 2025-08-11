import { getTokens, saveTokens } from "../screens/Login/services/tokenStorage";

const BASE_URL = "https://i13a609.p.ssafy.io/test";
const REFRESH_ENDPOINT = "/api/auth/token";

export async function refreshAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = await getTokens();
  if (!refreshToken) {
    console.warn("refreshAccessToken: refreshToken 없음");
    return null;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(BASE_URL + REFRESH_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("refreshAccessToken 실패:", res.status, text);
      return null;
    }

    const json = await res.json();
    const nextAccess: string | undefined = json?.data?.accessToken;
    const nextRefresh: string | undefined = json?.data?.refreshToken;

    if (!nextAccess) {
      return null;
    }

    await saveTokens({
      accessToken: nextAccess,
      refreshToken: nextRefresh ?? refreshToken,
    });

    return nextAccess;
  } catch (error) {
    console.error("토큰 갱신 호출 실패: ", error);
    return null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retry = false
) {
  const url = path.startsWith("http") ? path : BASE_URL + path;
  const headers = new Headers(init.headers || {});
  const { accessToken } = await getTokens();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status !== 401 || retry) return res;

  const newAccess = await refreshAccessToken();
  if (!newAccess) return res;

  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set("Authorization", `Bearer ${newAccess}`);
  if (
    !retryHeaders.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    retryHeaders.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers: retryHeaders });
}
