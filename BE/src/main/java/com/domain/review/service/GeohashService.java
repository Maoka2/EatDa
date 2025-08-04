package com.domain.review.service;

import ch.hsr.geohash.GeoHash;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class GeohashService {

    public String encode(double latitude, double longitude, int precision) {
        return GeoHash.geoHashStringWithCharacterPrecision(latitude, longitude, precision);
    }

    /**
     * 주어진 Geohash의 8방향 이웃 Geohash 반환
     *
     * @param geohash 중심 Geohash
     * @return 이웃 Geohash 집합
     */
    public Set<String> getNeighbors(String geohash) {
        Set<String> neighbors = new HashSet<>();

        try {
            GeoHash center = GeoHash.fromGeohashString(geohash);

            // 8방향 이웃 추가
            GeoHash[] adjacentHashes = center.getAdjacent();
            for (GeoHash adjacent : adjacentHashes) {
                neighbors.add(adjacent.toBase32());
            }

            // 대각선 방향 이웃도 추가 (선택적)
//            neighbors.add(center.getNorthernNeighbour().getEasternNeighbour().toBase32());
//            neighbors.add(center.getNorthernNeighbour().getWesternNeighbour().toBase32());
//            neighbors.add(center.getSouthernNeighbour().getEasternNeighbour().toBase32());
//            neighbors.add(center.getSouthernNeighbour().getWesternNeighbour().toBase32());

        } catch (Exception e) {
            // 예외 발생 시 빈 집합 반환
            return neighbors;
        }

        return neighbors;
    }

    /**
     * Geohash의 유효성 검증
     */
    public boolean isValid(String geohash) {
        try {
            GeoHash.fromGeohashString(geohash);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
