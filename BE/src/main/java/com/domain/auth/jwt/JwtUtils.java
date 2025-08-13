package com.domain.auth.jwt;

import com.domain.user.constants.Role;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.security.Key;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtUtils {

    private Key key;
    private final JwtProperties jwtProperties;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecretKey());
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractToken(final String header) {
        if (Objects.isNull(header) || !header.startsWith(JwtConstants.BEARER_PREFIX.getValue())) {
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
        return header.substring(JwtConstants.BEARER_PREFIX.getValue().length());
    }

    public Claims extractClaims(final String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (SecurityException | MalformedJwtException | ExpiredJwtException | UnsupportedJwtException |
                 IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
    }

    public String extractEmailFromToken(final String token) {
        return extractClaims(token).getSubject();
    }

    public Role extractRoleFromToken(final String token) {
        return Role.valueOf(extractClaims(token).get(JwtConstants.CLAIM_ROLE.getValue()).toString());
    }

    public boolean isAccessToken(final Claims claims) {
        return claims.get(JwtConstants.CLAIM_TYPE.getValue())
                .equals(JwtConstants.TOKEN_TYPE_ACCESS.getValue());
    }

    public Authentication getAuthentication(final Claims claims) {
        String email = claims.getSubject();
        String role = claims.get(JwtConstants.CLAIM_ROLE.getValue(), String.class);
        return new UsernamePasswordAuthenticationToken(email, "", AuthorityUtils.createAuthorityList(role));
    }
}
