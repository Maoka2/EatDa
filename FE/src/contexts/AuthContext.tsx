// src/contexts/AuthContext

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAuth,
  removeAuth,
  Role,
} from "../screens/Login/services/tokenStorage";

export type AuthContextType = {
  isLoggedIn: boolean;
  userRole: Role | null;
  isLoading: boolean;
  logout: () => void;
  login: (role: Role) => void;
};

//
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  isLoading: true, // 앱 시작 시 일단 로딩 상태로
  logout: () => console.warn("AuthProvider is not ready"), // 임시 로그아웃 함수
  login: () => console.warn("AuthProvider is not ready"),
});

export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider
type AuthProviderProps = {
  children: ReactNode; // children의 타입을 지정해줍니다.
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const auth = await getAuth();

        // 역할, 토큰 둘 다 있다면
        if (auth.accessToken && auth.role) {
          setIsLoggedIn(true);
          setUserRole(auth.role);
        }
      } catch (e) {
        console.error("인증 상태 확인 중 에러 발생", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  //   로그아웃
  const logout = async () => {
    await removeAuth();
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // 로그인
  const login = (role: Role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const value = {
    isLoggedIn,
    userRole,
    isLoading,
    logout,
    login,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
