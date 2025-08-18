package com.domain.menu.repository;

import com.domain.menu.entity.AdoptedMenuPoster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdoptedMenuPosterRepository extends JpaRepository<AdoptedMenuPoster, Long> {
    List<AdoptedMenuPoster> findByStoreIdAndDeletedFalse(Long storeId);

    @Query("""
        SELECT amp FROM AdoptedMenuPoster amp
        JOIN FETCH amp.menuPoster
        WHERE amp.store.id = :storeId
        ORDER BY amp.adoptedAt DESC
        """)
    List<AdoptedMenuPoster> findByStoreIdOrderByAdoptedAtDesc(@Param("storeId") Long storeId);

    Optional<AdoptedMenuPoster> findByStoreIdAndMenuPosterIdAndDeletedFalse(Long storeId, Long menuPosterId);
}
