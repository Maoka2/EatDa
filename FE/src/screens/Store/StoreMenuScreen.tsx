// src/screens/Store/StoreMenuScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ViewStyle,
  TextStyle,
} from "react-native";

import { menuData } from "../../data/menuData";

export default function StoreMenuScreen() {
  return (
    <FlatList
      data={menuData}
      renderItem={({ item }) => (
        <View style={styles.shadowWrapper}>
          <View style={styles.menuContainer}>
            {item.uri && (
              <Image source={{ uri: item.uri }} style={styles.menuImage} />
            )}
            <View style={styles.textWrapper}>
              <Text style={styles.menuName}>{item.menuName}</Text>
              <Text style={styles.menuDescription} numberOfLines={2}>
                {item.menuDescription}
              </Text>
            </View>
          </View>
        </View>
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 10 }}
    />
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    backgroundColor: "#f7f8f9",
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom:8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  menuContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f7f8f9",
  } as ViewStyle,

  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },

  textWrapper: {
    flex: 1,
    justifyContent: "center",
  },

  menuName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  } as TextStyle,

  menuDescription: {
    fontSize: 13,
    color: "#757575",
  } as TextStyle,
});
