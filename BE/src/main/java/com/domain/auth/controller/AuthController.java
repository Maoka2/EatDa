package com.domain.auth.controller;

import com.domain.auth.dto.request.SignInRequest;
import com.domain.auth.jwt.Jwt;
import com.domain.auth.mapper.AuthMapper;
import com.domain.auth.service.AuthService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthMapper authMapper;

    @PostMapping("/sign-in")
    public ResponseEntity<BaseResponse> signIn(@RequestBody SignInRequest request) {
        Jwt jwt = authService.signIn(request);
        return ApiResponseFactory.success(SuccessCode.SIGN_IN_SUCCESS, authMapper.toResponse(jwt));
    }

    @PostMapping("/sign-out")
    public ResponseEntity<BaseResponse> signOut(@RequestHeader("Authorization") String request) {
        authService.signOut();
        return ApiResponseFactory.success(SuccessCode.SIGN_OUT_SUCCESS);
    }

    @PostMapping("/token")
    public ResponseEntity<BaseResponse> tokenRefresh(@RequestHeader("Authorization") String request) {
        return ApiResponseFactory.success(SuccessCode.TOKEN_REFRESHED);
    }
}
