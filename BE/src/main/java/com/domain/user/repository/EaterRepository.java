package com.domain.user.repository;

import com.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface EaterRepository extends JpaRepository<User, Long>, UserRepository {
}
