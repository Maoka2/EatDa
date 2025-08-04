package com.domain.review.repository;

import com.domain.review.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface PoiRepository extends JpaRepository<Poi, Long> {

    // Geohash prefix로 검색 (인덱스 활용)
    @Query("SELECT p FROM Poi p WHERE p.geohash LIKE :prefix%")
    List<Poi> findByGeohashStartingWith(@Param("prefix") String prefix);

    // 특정 거리 내 POI 검색을 위한 추가 메서드
    @Query(value = "SELECT p.* FROM poi p " +
            "WHERE LEFT(p.geohash, :precision) IN :geohashPrefixes " +
            "AND ST_Distance_Sphere(POINT(p.longitude, p.latitude), " +
            "POINT(:lng, :lat)) <= :distance",
            nativeQuery = true)
    List<Poi> findNearbyPois(@Param("lat") double lat,
                             @Param("lng") double lng,
                             @Param("distance") int distance,
                             @Param("geohashPrefixes") Set<String> geohashPrefixes,
                             @Param("precision") int precision);
}