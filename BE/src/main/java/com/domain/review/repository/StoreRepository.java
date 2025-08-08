package com.domain.review.repository;

import com.domain.store.entity.Store;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StoreRepository extends JpaRepository<Store, Long> {
    @Query("SELECT p FROM Store p WHERE p.h3Index7 IN :h3Indexes")
    List<Store> findByH3Index7In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 8에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Store p WHERE p.h3Index8 IN :h3Indexes")
    List<Store> findByH3Index8In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 9에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Store p WHERE p.h3Index9 IN :h3Indexes")
    List<Store> findByH3Index9In(@Param("h3Indexes") List<Long> h3Indexes);

    /**
     * 해상도 10에서 여러 H3 인덱스로 POI 조회 (IN 절)
     */
    @Query("SELECT p FROM Store p WHERE p.h3Index10 IN :h3Indexes")
    List<Store> findByH3Index10In(@Param("h3Indexes") List<Long> h3Indexes);

}
