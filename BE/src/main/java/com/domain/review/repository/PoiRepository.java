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

    /**
     * 해상도 7에서 H3 인덱스로 POI 조회
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index7 = :h3Index")
    List<Poi> findByH3Index7(@Param("h3Index") Long h3Index);

    /**
     * 해상도 8에서 H3 인덱스로 POI 조회
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index8 = :h3Index")
    List<Poi> findByH3Index8(@Param("h3Index") Long h3Index);

    /**
     * 해상도 9에서 H3 인덱스로 POI 조회
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index9 = :h3Index")
    List<Poi> findByH3Index9(@Param("h3Index") Long h3Index);

    /**
     * 해상도 10에서 H3 인덱스로 POI 조회
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index10 = :h3Index")
    List<Poi> findByH3Index10(@Param("h3Index") Long h3Index);

    /**
     * 해상도 7에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index7 IN :h3Indexes")
    List<Poi> findByH3Index7In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 8에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index8 IN :h3Indexes")
    List<Poi> findByH3Index8In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 9에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index9 IN :h3Indexes")
    List<Poi> findByH3Index9In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 10에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index10 IN :h3Indexes")
    List<Poi> findByH3Index10In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 여러 해상도별 H3 인덱스로 POI 조회 (IN 절 사용)
     */
    @Query("SELECT p FROM Poi p WHERE p.h3Index7 IN :h3Indexes OR p.h3Index8 IN :h3Indexes OR p.h3Index9 IN :h3Indexes OR p.h3Index10 IN :h3Indexes")
    List<Poi> findByH3IndexIn(@Param("h3Indexes") List<Long> h3Indexes);
}
