import { getTokens, removeAuth } from "../screens/Login/services/tokenStorage";
import { apiFetch } from "./refresh";

const BASE_URL = "https://i13a609.p.ssafy.io/test";
const SIGNOUT_ENDPOINT = "/api/auth/sign-out";

export async function logOut(): Promise<boolean> {
  const { refreshToken } = await getTokens();

  if (!refreshToken) {
    console.warn("로그아웃 : refreshToken 은 없음");
    removeAuth();
    return true;
  }

  try {
    const res = await fetch(BASE_URL + SIGNOUT_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    console.log("로그아웃 API 호출해서 로그아웃 성공!")
    return res.ok;
  } catch (error) {
    console.log("로그아웃 호출에 실패하였습니다.");
    return false;
  } finally {
    await removeAuth();
  }
}
