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
import { useRoute } from "@react-navigation/native";
//

// 사이드바에 사용될 숟가락, 포크 이미지
import Sidebar from "./Sidebar";

export interface Props {
  userRole: "eater" | "maker";
  onMypage: () => void;
}

export default function HamburgerButton({ userRole, onMypage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  const route = useRoute();
  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    // 사이드바 열고 닫기 관리
    <>
      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Text style={styles.icon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="none">
        <Sidebar
          onClose={handleClose}
          userRole={userRole}
          onMypage={onMypage}
          activePage={route.name as string}
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
