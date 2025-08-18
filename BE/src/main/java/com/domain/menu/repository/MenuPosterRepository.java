package com.domain.menu.repository;

import com.domain.menu.entity.MenuPoster;
import com.global.constants.Status;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuPosterRepository extends JpaRepository<MenuPoster, Long> {

    Long countByUserIdAndStatus(Long userId, Status status);

    Long countByStoreIdAndStatus(Long storerId, Status status);

    List<MenuPoster> findByUserIdAndStatus(Long userId, Status status);

    List<MenuPoster> findByStoreIdAndStatus(Long storeId, Status status);

    Optional<MenuPoster> findByIdAndDeletedFalse(Long id);
}
