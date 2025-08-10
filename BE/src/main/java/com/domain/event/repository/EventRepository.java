package com.domain.event.repository;

import com.domain.event.entity.Event;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    @Query("SELECT e FROM Event e " +
            "LEFT JOIN FETCH EventAsset ea ON ea.event = e " +
            "WHERE e.store.maker.email = :email " +
            "AND e.store.deleted = false " +
            "AND (:lastEventId IS NULL OR e.id < :lastEventId) " +
            "ORDER BY e.id DESC")
    List<Event> findMyEventsWithCursor(@Param("email") String email,
                                       @Param("lastEventId") Long lastEventId,
                                       Pageable pageable);
}
