package com.domain.auth.jwt;

import com.domain.user.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Date;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final JwtProperties jwtProperties;

    private Key key;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecretKey());
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public Jwt generateTokens(final User user) {
        return Jwt.builder()
                .accessToken(generateAccessToken(user))
                .refreshToken(generateRefreshToken(user))
                .build();
    }

    public String generateAccessToken(final User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessExpiration());

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim(JwtConstants.CLAIM_TYPE.getValue(), JwtConstants.TOKEN_TYPE_ACCESS.getValue())
                .claim(JwtConstants.CLAIM_ROLE.getValue(), user.getRole())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(final User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim(JwtConstants.CLAIM_TYPE.getValue(), JwtConstants.TOKEN_TYPE_REFRESH.getValue())
                .claim(JwtConstants.CLAIM_ROLE.getValue(), user.getRole())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key)
                .compact();
    }
}
