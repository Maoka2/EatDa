package com.domain.event.repository;

import com.domain.event.entity.Event;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    // 삭제되지 않은 이벤트 단건 조회
    @Query("SELECT e FROM Event e WHERE e.id = :id AND e.deleted = false")
    Optional<Event> findByIdAndDeletedFalse(@Param("id") Long id);

    // 내 이벤트 목록 조회 (deleted = false 조건 추가)
    @Query("SELECT e FROM Event e " +
            "LEFT JOIN FETCH EventAsset ea ON ea.event = e " +
            "WHERE e.store.maker.email = :email " +
            "AND e.store.deleted = false " +
            "AND e.deleted = false " +  // Event 자체의 deleted 체크 추가
            "AND (:lastEventId IS NULL OR e.id < :lastEventId) " +
            "ORDER BY e.id DESC")
    List<Event> findMyEventsWithCursor(@Param("email") String email,
                                       @Param("lastEventId") Long lastEventId,
                                       Pageable pageable);

    // 진행 중인 가게 이벤트 조회 (deleted = false 조건 추가)
    @Query("SELECT e FROM Event e " +
            "WHERE e.store.id = :storeId " +
            "AND e.store.deleted = false " +  // Store deleted 체크
            "AND e.deleted = false " +  // Event deleted 체크 추가
            "AND e.status = 'SUCCESS' " +
            "AND e.startDate <= :currentDate " +
            "AND e.endDate >= :currentDate " +
            "AND (:lastEventId IS NULL OR e.id < :lastEventId) " +
            "ORDER BY e.id DESC")
    List<Event> findActiveStoreEvents(@Param("storeId") Long storeId,
                                      @Param("currentDate") LocalDate currentDate,
                                      @Param("lastEventId") Long lastEventId,
                                      Pageable pageable);
}
