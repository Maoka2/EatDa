import React from "react";
import {View, Text, StyleSheet} from "react-native"

import NoContentImage from "../../assets/noContentImage.svg"

export default function NoDataScreen(){
    return (
        <View style={styles.noData}>
            <NoContentImage></NoContentImage>
            <Text style={styles.noDataText}>해당하는 정보가 없습니다.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    noData:{
        flex:1,
        justifyContent:"center",
        alignItems:"center",

    },
    noDataText:{
        fontSize:20,
    }
})