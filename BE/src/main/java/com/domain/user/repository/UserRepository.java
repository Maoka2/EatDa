package com.domain.user.repository;

import com.domain.user.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository {

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    Optional<User> findByEmailAndDeletedFalse(String email);

    Optional<User> findByNicknameAndDeletedFalse(String nickname);

}
