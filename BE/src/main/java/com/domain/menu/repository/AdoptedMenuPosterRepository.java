package com.domain.menu.repository;

import com.domain.menu.entity.AdoptedMenuPoster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdoptedMenuPosterRepository extends JpaRepository<AdoptedMenuPoster, Long> {
    List<AdoptedMenuPoster> findByStoreIdAndDeletedFalse(Long storeId);
}
