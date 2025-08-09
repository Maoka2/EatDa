package com.domain.auth.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.constants.ErrorCode;
import com.global.dto.response.ErrorResponse;
import com.global.exception.ApiException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtExceptionFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response,
                                    final FilterChain filterChain)
            throws ServletException, IOException {
        try {
            doFilter(request, response, filterChain);
        } catch (ApiException e) {
            ErrorCode errorCode = e.getErrorCode();

            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(errorCode.getStatus());

            objectMapper.writeValue(response.getWriter(), ErrorResponse.of(errorCode));
        }
    }
}
