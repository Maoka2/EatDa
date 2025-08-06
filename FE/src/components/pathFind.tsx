// src/components/pathFind.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PublicRoute } from "../data/findWayData";
import BusIcon from "../../assets/whiteBus.svg";
import SubwayIcon from "../../assets/whiteSubway.svg";
import WalkingManIcon from "../../assets/whiteWalkingMan.svg";
type PathFindProps = {
  route: PublicRoute;
};

export default function PathFind({ route }: PathFindProps) {
  return (
    <View style={styles.container}>
      {route.subPaths.map((section, idx) => (
        <View key={idx} style={styles.sectionRow}>
          {/* 아이콘 영역 */}
          <View style={styles.iconCol}>
            {section.type === 1 && (
              <View style={styles.circle}>
                <SubwayIcon width={20} height={20} />
              </View>
            )}
            {section.type === 2 && (
              <View style={styles.circle}>
                <BusIcon width={20} height={20} />
              </View>
            )}
            {section.type === 3 && (
              <View style={styles.circle}>
                <WalkingManIcon></WalkingManIcon>
              </View>
            )}
          </View>

          {/* 정보 영역 */}
          <View style={styles.infoCol}>
            {/* 정류장 이름 */}
            {(section.startName || section.endName) && (
              <Text style={styles.stationText}>
                {section.startName ?? ""} → {section.endName ?? ""}
              </Text>
            )}

            {/* 노선 이름 */}
            {(section.subwayName || section.busNum) && (
              <View style={styles.lineRow}>
                <Text
                  style={[
                    styles.lineBox,
                    {
                      backgroundColor:
                        section.type === 1
                          ? section.subwayColor ?? "#888"
                          : section.busColor ?? "#888",
                    },
                  ]}
                >
                  {section.subwayName ?? section.busNum}
                </Text>
              </View>
            )}

            {/* 도보일 경우 시간/거리 출력 */}
            {section.type === 3 && (
              <Text style={styles.walkInfo}>
                도보 {section.time}분 / {section.distance}m
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconCol: {
    width: 24,
    alignItems: "center",
    gap: 4,
  },
  circle: {
    width: 30,
    height: 30,
    backgroundColor: "#3A4CA8",
    borderRadius: 18,
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  walkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  walkText: {
    fontSize: 12,
    color: "#000",
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  stationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  lineRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  lineBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
  walkInfo: {
    fontSize: 12,
    color: "#555",
  },
});
