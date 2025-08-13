package com.domain.auth.repository.Impl;

import com.domain.auth.jwt.JwtProperties;
import com.domain.auth.repository.AuthRepository;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AuthRepositoryImpl implements AuthRepository {

    private final StringRedisTemplate redisTemplate;
    private final JwtProperties jwtProperties;

    @Override
    public void saveToken(final String email, final String refreshToken) {
        redisTemplate.opsForValue().set(email, refreshToken, jwtProperties.getRefreshExpiration(), TimeUnit.SECONDS);
    }

    @Override
    public String getToken(final String email) {
        return redisTemplate.opsForValue().get(email);
    }

    @Override
    public void deleteToken(final String email) {
        redisTemplate.delete(email);
    }
}
