package com.domain.user.repository;

import com.domain.user.dto.response.MakerGetProfileResponse;
import com.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface MakerRepository extends JpaRepository<User, Long>, UserRepository {
    @Query("""
    SELECT new com.domain.user.dto.response.MakerGetProfileResponse(
        s.id,
        s.name,
        CAST((SELECT COUNT(r) FROM Review r WHERE r.store.id = s.id) AS long),
        CAST((SELECT COUNT(e) FROM Event e WHERE e.store.id = s.id) AS long),
        CAST(COUNT(DISTINCT m.id) AS long)
    )
    FROM User u
    JOIN u.stores s
    LEFT JOIN s.menuPosters m
    WHERE u.email = :email 
    AND u.deleted = false
    GROUP BY s.id, s.name
    """)
    Optional<MakerGetProfileResponse> getProfileByEmail(@Param("email") String email);
}
