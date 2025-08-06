// src/components/Hamburger.tsx

import React, { useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
  Modal,
} from "react-native";

//

// 사이드바에 사용될 숟가락, 포크 이미지
import Sidebar from "./Sidebar";

export interface Props {
  userRole: "eater" | "maker";
  onLogout: () => void;
  onMypage: () => void;
  activePage?: string; // activePage prop 추가
}

export default function HamburgerButton({
  userRole,
  onLogout,
  onMypage,
  activePage = "reviewPage", // 기본값 설정
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // 사이드바 열고 닫기 관리
    <>
      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Text style={styles.icon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="none">
        <Sidebar
          isOpen={true}
          onClose={() => setIsOpen(false)}
          userRole={userRole}
          onLogout={onLogout}
          activePage={activePage} // props로 받은 activePage 전달
          onMypage={onMypage}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingTop: 4,
    marginTop: 3,
  },
});
