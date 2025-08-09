package com.domain.auth.jwt;

import com.domain.auth.config.PublicEndpoint;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response,
                                    final FilterChain filterChain)
            throws ServletException, IOException {
        extractJwtFromRequest(request)
                .map(jwtUtils::extractClaims)
                .filter(jwtUtils::isAccessToken)
                .map(jwtUtils::getAuthentication)
                .ifPresent(SecurityContextHolder.getContext()::setAuthentication);

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(final HttpServletRequest request) throws ServletException {
        return PublicEndpoint.matches(request.getRequestURI());
    }

    private Optional<String> extractJwtFromRequest(final HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(JwtConstants.AUTHORIZATION_HEADER.getValue()))
                .filter(header -> header.startsWith(JwtConstants.BEARER_PREFIX.getValue()))
                .map(header -> header.substring((JwtConstants.BEARER_PREFIX.getValue().length())));
    }
}
